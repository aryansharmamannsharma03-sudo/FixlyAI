import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { supabase } from "../supabase";

type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationTitle, setConversationTitle] =
    useState("Conversation");

  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversation = async () => {
    try {
      setLoading(true);
      setError("");

      if (!id) {
        setError("Conversation not found.");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log(
          "Conversation user error:",
          userError
        );
      }

      if (!user) {
        setError("Please login to view this conversation.");
        return;
      }

      // Get conversation
      const { data: conversation, error: conversationError } =
        await supabase
          .from("conversations")
          .select("id, title")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

      if (conversationError) {
        console.log(
          "Conversation load error:",
          conversationError
        );

        setError(
          "This conversation could not be found."
        );

        return;
      }

      setConversationTitle(
        conversation.title || "Conversation"
      );

      // Get messages
      const { data: messageData, error: messageError } =
        await supabase
          .from("messages")
          .select(
            "id, conversation_id, role, content, created_at"
          )
          .eq("conversation_id", id)
          .order("created_at", {
            ascending: true,
          });

      if (messageError) {
        console.log(
          "Messages load error:",
          messageError
        );

        setError(
          "Unable to load conversation messages."
        );

        return;
      }

      setMessages(messageData || []);

      console.log(
        "CONVERSATION LOADED:",
        id
      );

      console.log(
        "MESSAGES LOADED:",
        messageData?.length || 0
      );
    } catch (err) {
      console.log(
        "Unexpected conversation error:",
        err
      );

      setError(
        "Something went wrong while loading this conversation."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [id])
  );

  const sendFollowUp = async () => {
    if (!problem.trim() || sending || !id) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log(
          "Follow-up user error:",
          userError
        );
      }

      if (!user) {
        setError("Please login first.");
        return;
      }

      const userQuestion = problem.trim();

      // Verify conversation belongs to current user
      const { data: conversation, error: conversationError } =
        await supabase
          .from("conversations")
          .select("id")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

      if (conversationError || !conversation) {
        console.log(
          "Conversation ownership error:",
          conversationError
        );

        setError(
          "You cannot access this conversation."
        );

        return;
      }

      // Save user follow-up
      const { data: savedUserMessage, error: userMessageError } =
        await supabase
          .from("messages")
          .insert({
            conversation_id: id,
            role: "user",
            content: userQuestion,
          })
          .select(
            "id, conversation_id, role, content, created_at"
          )
          .single();

      if (userMessageError) {
        console.log(
          "Follow-up user message error:",
          userMessageError
        );

        setError(
          "Your message could not be saved."
        );

        return;
      }

      if (savedUserMessage) {
        setMessages((current) => [
          ...current,
          savedUserMessage,
        ]);
      }

      setProblem("");

      // Prepare previous conversation context
      const conversationContext = messages
        .map(
          (message) =>
            `${message.role === "user" ? "User" : "Fixly AI"}: ${message.content}`
        )
        .join("\n\n");

      const fullProblem =
        conversationContext +
        `\n\nUser: ${userQuestion}`;

      // Ask Fixly AI
      const { data, error } =
        await supabase.functions.invoke(
          "analyze-problem",
          {
            body: {
              problem: fullProblem,
              languageInstruction:
                "Reply in the same language as the user. If the user writes in Hindi, reply in Hindi. If the user writes in Hinglish, reply in Hinglish. If the user writes in English, reply in English.",
            },
          }
        );

      if (error) {
        console.log(
          "Follow-up AI error:",
          error
        );

        setError(
          "Fixly AI could not answer right now."
        );

        return;
      }

      console.log(
        "FOLLOW-UP AI RESPONSE:",
        data
      );

      if (!data?.success || !data?.answer) {
        setError(
          "No answer received from Fixly AI."
        );

        return;
      }

      let finalAnswer = data.answer;

      try {
        const aiResult = JSON.parse(data.answer);

        console.log(
          "FOLLOW-UP AI PARSED:",
          aiResult
        );

        finalAnswer =
          aiResult.answer || data.answer;

        // If follow-up creates a task
        if (aiResult.type === "task") {
          const { error: taskError } =
            await supabase
              .from("tasks")
              .insert({
                user_id: user.id,
                title: aiResult.title,
                category: aiResult.category,
                priority: aiResult.priority,
                deadline: aiResult.deadline,
                completed: false,
              });

          if (taskError) {
            console.log(
              "Follow-up task error:",
              taskError
            );
          } else {
            console.log(
              "FOLLOW-UP TASK SAVED"
            );
          }
        }
      } catch (parseError) {
        console.log(
          "Follow-up JSON parse error:",
          parseError
        );
      }

      // Save AI response
      const {
        data: savedAIMessage,
        error: aiMessageError,
      } = await supabase
        .from("messages")
        .insert({
          conversation_id: id,
          role: "assistant",
          content: finalAnswer,
        })
        .select(
          "id, conversation_id, role, content, created_at"
        )
        .single();

      if (aiMessageError) {
        console.log(
          "Follow-up AI message error:",
          aiMessageError
        );

        setError(
          "AI response could not be saved."
        );

        return;
      }

      if (savedAIMessage) {
        setMessages((current) => [
          ...current,
          savedAIMessage,
        ]);
      }

      console.log(
        "FOLLOW-UP AI MESSAGE SAVED:",
        id
      );
    } catch (err) {
      console.log(
        "Unexpected follow-up error:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({
    item,
  }: {
    item: Message;
  }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isUser
            ? styles.userRow
            : styles.aiRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.roleText,
              isUser
                ? styles.userRole
                : styles.aiRole,
            ]}
          >
            {isUser ? "You" : "✨ Fixly AI"}
          </Text>

          <Text
            style={[
              styles.messageText,
              isUser
                ? styles.userMessageText
                : styles.aiMessageText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#16B8A6"
        />

        <Text style={styles.loadingText}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>
          ⚠️
        </Text>

        <Text style={styles.errorTitle}>
          Something went wrong
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
        >
          <Text style={styles.backText}>
            ←
          </Text>
        </Pressable>

        <View style={styles.headerContent}>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {conversationTitle}
          </Text>

          <Text style={styles.headerSubtitle}>
            Fixly AI conversation
          </Text>
        </View>
      </View>

      {error !== "" && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {error}
          </Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.messagesList
        }
        keyboardShouldPersistTaps="handled"
      />

      <View style={styles.inputArea}>
        <TextInput
          value={problem}
          onChangeText={setProblem}
          placeholder="Ask a follow-up question..."
          placeholderTextColor="#65798F"
          multiline
          maxLength={1000}
          style={styles.followUpInput}
          editable={!sending}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!problem.trim() || sending) &&
              styles.sendDisabled,
          ]}
          onPress={sendFollowUp}
          disabled={
            !problem.trim() || sending
          }
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.sendText}>
              ↑
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
  },

  center: {
    flex: 1,
    backgroundColor: "#07111F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    color: "#8FA0B4",
    fontSize: 14,
    marginTop: 12,
  },

  errorIcon: {
    fontSize: 45,
    marginBottom: 15,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },

  errorText: {
    color: "#8193A8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: "#16B8A6",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 25,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 15,
    backgroundColor: "#0B1928",
    borderBottomWidth: 1,
    borderBottomColor: "#1A3044",
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#102235",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 24,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#71849A",
    fontSize: 12,
    marginTop: 3,
  },

  errorBanner: {
    backgroundColor: "#3A2020",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  errorBannerText: {
    color: "#FFB4B4",
    fontSize: 12,
    textAlign: "center",
  },

  messagesList: {
    padding: 18,
    paddingBottom: 25,
  },

  messageRow: {
    width: "100%",
    marginBottom: 14,
  },

  userRow: {
    alignItems: "flex-end",
  },

  aiRow: {
    alignItems: "flex-start",
  },

  messageBubble: {
    maxWidth: "88%",
    borderRadius: 20,
    padding: 15,
  },

  userBubble: {
    backgroundColor: "#16B8A6",
    borderBottomRightRadius: 5,
  },

  aiBubble: {
    backgroundColor: "#102235",
    borderWidth: 1,
    borderColor: "#1D3A50",
    borderBottomLeftRadius: 5,
  },

  roleText: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 7,
  },

  userRole: {
    color: "#E8FFFB",
  },

  aiRole: {
    color: "#16B8A6",
  },

  messageText: {
    fontSize: 15,
    lineHeight: 23,
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  aiMessageText: {
    color: "#D8E2ED",
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#0B1928",
    borderTopWidth: 1,
    borderTopColor: "#1A3044",
  },

  followUpInput: {
    flex: 1,
    maxHeight: 110,
    minHeight: 48,
    backgroundColor: "#102235",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1D3A50",
    color: "#FFFFFF",
    fontSize: 14,
    paddingHorizontal: 17,
    paddingTop: 13,
    paddingBottom: 11,
    marginRight: 9,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
  },

  sendDisabled: {
    opacity: 0.4,
  },

  sendText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
  },
});