import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { supabase } from "../supabase";
import {
  scheduleTaskReminder,
} from "../notifications";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function SolveScreen() {
  const [problem, setProblem] = useState("");
  const [followUp, setFollowUp] = useState("");

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [chatStarted, setChatStarted] = useState(false);

  // =====================================================
  // AUDIO RECORDER
  // =====================================================

  const audioRecorder = useAudioRecorder(
    RecordingPresets.HIGH_QUALITY
  );

  const recorderState =
    useAudioRecorderState(audioRecorder);

  // =====================================================
  // SCREENSHOT
  // =====================================================

  const pickScreenshot = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        console.log("PHOTO PERMISSION DENIED");
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets.length > 0
      ) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log("IMAGE PICKER ERROR:", error);
    }
  };

  // =====================================================
  // VOICE RECORDING
  // =====================================================

  const toggleRecording = async () => {
    try {
      // STOP RECORDING
      if (recorderState.isRecording) {
        await audioRecorder.stop();

        const uri = audioRecorder.uri;

        if (uri) {
          setAudioUri(uri);
          console.log("VOICE READY:", uri);
        }

        return;
      }

      // REQUEST MICROPHONE PERMISSION
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        console.log("MICROPHONE PERMISSION DENIED");
        return;
      }

      // PREPARE RECORDER
      await audioRecorder.prepareToRecordAsync();

      // START RECORDING
      audioRecorder.record();

      console.log("VOICE RECORDING STARTED");
    } catch (error) {
      console.log("VOICE RECORDING ERROR:", error);
    }
  };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async (text: string) => {
    if (
      !text.trim() &&
      !imageUri &&
      !audioUri
    ) {
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // USER TEXT
      // =================================================

      const userText =
        text.trim() ||
        (audioUri
          ? "Voice Problem"
          : imageUri
          ? "Image Problem"
          : "");

      // =================================================
      // GET LOGGED-IN USER
      // =================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log("USER ERROR:", userError);
        return;
      }

      // =================================================
      // IMAGE BASE64
      // =================================================

      let imageBase64: string | null = null;

      if (imageUri) {
        imageBase64 =
          await FileSystem.readAsStringAsync(
            imageUri,
            {
              encoding: "base64",
            }
          );

        console.log(
          "IMAGE READY:",
          imageBase64.length
        );
      }

      // =================================================
      // AUDIO BASE64
      // =================================================

      let audioBase64: string | null = null;

      if (audioUri) {
        audioBase64 =
          await FileSystem.readAsStringAsync(
            audioUri,
            {
              encoding: "base64",
            }
          );

        console.log(
          "AUDIO READY:",
          audioBase64.length
        );
      }

      // =================================================
      // CREATE CONVERSATION
      // =================================================

      let currentConversationId =
        conversationId;

      if (!currentConversationId) {
        const {
          data: conversation,
          error: conversationError,
        } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            title: userText,
          })
          .select("id")
          .single();

        if (conversationError) {
          console.log(
            "CONVERSATION ERROR:",
            conversationError
          );
          return;
        }

        currentConversationId =
          conversation.id;

        setConversationId(
          currentConversationId
        );

        console.log(
          "CONVERSATION CREATED:",
          currentConversationId
        );
      }

      // =================================================
      // SAVE USER MESSAGE
      // =================================================

      const {
        error: userMessageError,
      } = await supabase
        .from("messages")
        .insert({
          conversation_id:
            currentConversationId,
          role: "user",
          content: userText,
        });

      if (userMessageError) {
        console.log(
          "USER MESSAGE ERROR:",
          userMessageError
        );
        return;
      }

      console.log("USER MESSAGE SAVED");

      // =================================================
      // ADD USER MESSAGE TO UI
      // =================================================

      const newUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
      };

      setMessages((prev) => [
        ...prev,
        newUserMessage,
      ]);

      // =================================================
      // BUILD CHAT CONTEXT
      // =================================================

      const previousContext =
        messages
          .map(
            (message) =>
              `${
                message.role === "user"
                  ? "User"
                  : "Fixly AI"
              }: ${message.content}`
          )
          .join("\n\n");

      const fullProblem =
        previousContext
          ? `${previousContext}\n\nUser: ${userText}`
          : userText;

      // =================================================
      // CLEAR INPUT
      // =================================================

      setProblem("");
      setFollowUp("");
      setImageUri(null);
      setAudioUri(null);

      setChatStarted(true);

      // =================================================
      // CALL FIXLY AI
      // =================================================

      const {
        data,
        error,
      } = await supabase.functions.invoke(
        "analyze-problem",
        {
          body: {
            problem: fullProblem,
            imageBase64,
            audioBase64,
            languageInstruction:
              "Reply in the same language as the user. If the user writes in Hindi, reply in Hindi. If the user writes in Hinglish, reply in Hinglish. If the user writes in English, reply in English.",
          },
        }
      );

      if (error) {
        console.log(
          "SUPABASE FUNCTION ERROR:",
          error
        );
        return;
      }

      console.log(
        "FIXLY AI RESPONSE:",
        data
      );

      if (
        !data?.success ||
        !data?.answer
      ) {
        console.log("NO AI ANSWER");
        return;
      }

      // =================================================
      // PARSE AI RESPONSE
      // =================================================

      let aiText = data.answer;

      try {
  const aiResult =
    JSON.parse(data.answer);
    // Fix reminder time on the device
if (
  aiResult.type === "task" &&
  aiResult.reminderAt &&
  /\b(\d+)\s*(minute|minutes|min|mins)\b/i.test(fullProblem)
) {
  const match = fullProblem.match(
    /\b(\d+)\s*(minute|minutes|min|mins)\b/i
  );

  if (match) {
    const minutes = Number(match[1]);
    const reminderDate = new Date(
      Date.now() + minutes * 60 * 1000
    );

    aiResult.reminderAt =
      reminderDate.toISOString();

    aiResult.deadline =
      reminderDate.toISOString();

    console.log(
      "REMINDER TIME FIXED:",
      reminderDate.toString()
    );
  }
}

  console.log(
    "AI RESULT PARSED:",
    aiResult
  );

  aiText =
    aiResult.answer ||
    data.answer;

  // ===============================================
  // SAVE TASK + SCHEDULE REMINDER
  // ===============================================

  if (aiResult.type === "task") {
    const {
      data: savedTask,
      error: taskError,
    } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: aiResult.title,
        category: aiResult.category,
        priority: aiResult.priority,
        deadline: aiResult.deadline,
        completed: false,
      })
      .select("id")
      .single();

    if (taskError || !savedTask) {
      console.log(
        "TASK ERROR:",
        taskError
      );
    } else {
      console.log(
        "TASK SAVED:",
        savedTask.id,
        aiResult.title
      );

      // =============================================
      // SCHEDULE REMINDER
      // =============================================

      if (aiResult.reminderAt) {
        const reminderDate =
          new Date(aiResult.reminderAt);

        if (
          !isNaN(
            reminderDate.getTime()
          )
        ) {
          const notificationId =
            await scheduleTaskReminder(
              savedTask.id,
              aiResult.title,
              reminderDate
            );

          console.log(
            "REMINDER SCHEDULED:",
            notificationId
          );
        } else {
          console.log(
            "INVALID REMINDER DATE:",
            aiResult.reminderAt
          );
        }
      } else {
        console.log(
          "NO REMINDER TIME PROVIDED"
        );
      }
    }
  }

} catch {
  console.log(
    "AI RESPONSE WAS NOT JSON"
  );
}
      // =================================================
      // ADD AI MESSAGE TO UI
      // =================================================

      const newAIMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiText,
      };

      setMessages((prev) => [
        ...prev,
        newAIMessage,
      ]);

      // =================================================
      // SAVE AI MESSAGE
      // =================================================

      const {
        error: aiMessageError,
      } = await supabase
        .from("messages")
        .insert({
          conversation_id:
            currentConversationId,
          role: "assistant",
          content: aiText,
        });

      if (aiMessageError) {
        console.log(
          "AI MESSAGE ERROR:",
          aiMessageError
        );
      } else {
        console.log(
          "AI MESSAGE SAVED:",
          currentConversationId
        );
      }
    } catch (error) {
      console.log(
        "SEND ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
        >
          <Text style={styles.back}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.badge}>
          ✦ FIXLY AI
        </Text>
      </View>

      {/* =================================================
          INITIAL PROBLEM SCREEN
          ================================================= */}

      {!chatStarted ? (
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            What's going wrong?
          </Text>

          <Text style={styles.subtitle}>
            Tell us what happened. Give as
            much detail as you can.
          </Text>

          {/* INPUT */}

          <View style={styles.inputCard}>
            <Text
              style={styles.inputLabel}
            >
              Describe your problem
            </Text>

            <TextInput
              value={problem}
              onChangeText={setProblem}
              placeholder="Example: My phone keeps showing a storage error..."
              placeholderTextColor="#62748A"
              multiline
              textAlignVertical="top"
              style={styles.input}
              maxLength={1000}
            />

            <Text style={styles.counter}>
              {problem.length}/1000
            </Text>
          </View>

          {/* IMAGE PREVIEW */}

          {imageUri && (
            <View
              style={styles.previewCard}
            >
              <Text
                style={styles.previewTitle}
              >
                Screenshot selected ✓
              </Text>

              <Image
                source={{
                  uri: imageUri,
                }}
                style={
                  styles.previewImage
                }
              />

              <Pressable
                onPress={pickScreenshot}
                style={
                  styles.changeButton
                }
              >
                <Text
                  style={
                    styles.changeText
                  }
                >
                  Change Screenshot
                </Text>
              </Pressable>
            </View>
          )}

          {/* METHODS */}

          {!imageUri && (
            <View style={styles.methods}>
              {/* SCREENSHOT */}

              <Pressable
                style={styles.method}
                onPress={
                  pickScreenshot
                }
              >
                <Text
                  style={
                    styles.methodIcon
                  }
                >
                  📸
                </Text>

                <Text
                  style={
                    styles.methodTitle
                  }
                >
                  Screenshot
                </Text>

                <Text
                  style={
                    styles.methodText
                  }
                >
                  Show us the problem
                </Text>
              </Pressable>

              {/* VOICE */}

              <Pressable
                style={[
                  styles.method,
                  recorderState.isRecording &&
                    styles.recordingMethod,
                ]}
                onPress={
                  toggleRecording
                }
              >
                <Text
                  style={
                    styles.methodIcon
                  }
                >
                  🎤
                </Text>

                <Text
                  style={
                    styles.methodTitle
                  }
                >
                  {recorderState.isRecording
                    ? "Stop Recording"
                    : "Voice"}
                </Text>

                <Text
                  style={
                    styles.methodText
                  }
                >
                  {recorderState.isRecording
                    ? "Tap to stop"
                    : audioUri
                    ? "Voice ready ✓"
                    : "Tell us naturally"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* VOICE READY */}

          {audioUri && (
            <View
              style={
                styles.voiceReadyCard
              }
            >
              <Text
                style={
                  styles.voiceReadyText
                }
              >
                🎤 Voice recording ready ✓
              </Text>

              <Pressable
                onPress={() =>
                  setAudioUri(null)
                }
              >
                <Text
                  style={
                    styles.removeVoice
                  }
                >
                  Remove
                </Text>
              </Pressable>
            </View>
          )}

          {/* ANALYZE */}

          <Pressable
            style={[
              styles.analyzeButton,
              (
                !problem.trim() &&
                !imageUri &&
                !audioUri
              ) || loading
                ? styles.disabledButton
                : null,
            ]}
            onPress={() =>
              sendMessage(problem)
            }
            disabled={
              loading ||
              (
                !problem.trim() &&
                !imageUri &&
                !audioUri
              )
            }
          >
            <Text
              style={
                styles.analyzeText
              }
            >
              {loading
                ? "Analyzing..."
                : "Analyze Problem"}
            </Text>

            <Text
              style={styles.arrow}
            >
              →
            </Text>
          </Pressable>
        </ScrollView>
      ) : (
        <>
          {/* =================================================
              CHAT
              ================================================= */}

          <ScrollView
            style={styles.chat}
            contentContainerStyle={
              styles.chatContent
            }
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(
              (message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.role ===
                    "user"
                      ? styles.userRow
                      : styles.aiRow,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.role ===
                      "user"
                        ? styles.userBubble
                        : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={
                        styles.messageRole
                      }
                    >
                      {message.role ===
                      "user"
                        ? "You"
                        : "✦ Fixly AI"}
                    </Text>

                    <Text
                      style={
                        styles.messageText
                      }
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              )
            )}

            {loading && (
              <View
                style={[
                  styles.messageBubble,
                  styles.aiBubble,
                ]}
              >
                <Text
                  style={
                    styles.messageRole
                  }
                >
                  ✦ Fixly AI
                </Text>

                <Text
                  style={
                    styles.messageText
                  }
                >
                  Thinking...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* =================================================
              CHAT INPUT
              ================================================= */}

          <View
            style={
              styles.chatInputArea
            }
          >
            {audioUri && (
              <View
                style={
                  styles.voiceReadyCard
                }
              >
                <Text
                  style={
                    styles.voiceReadyText
                  }
                >
                  🎤 Voice ready ✓
                </Text>

                <Pressable
                  onPress={() =>
                    setAudioUri(null)
                  }
                >
                  <Text
                    style={
                      styles.removeVoice
                    }
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            )}

            {imageUri && (
              <View
                style={
                  styles.chatImageReady
                }
              >
                <Text
                  style={
                    styles.voiceReadyText
                  }
                >
                  📷 Screenshot ready ✓
                </Text>

                <Pressable
                  onPress={() =>
                    setImageUri(null)
                  }
                >
                  <Text
                    style={
                      styles.removeVoice
                    }
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            )}

            <View
              style={styles.inputRow}
            >
              {/* IMAGE */}

              <Pressable
                style={
                  styles.imageButton
                }
                onPress={
                  pickScreenshot
                }
              >
                <Text
                  style={
                    styles.imageButtonText
                  }
                >
                  📷
                </Text>
              </Pressable>

              {/* VOICE */}

              <Pressable
                style={[
                  styles.voiceButton,
                  recorderState.isRecording &&
                    styles.recordingButton,
                ]}
                onPress={
                  toggleRecording
                }
              >
                <Text
                  style={
                    styles.imageButtonText
                  }
                >
                  🎤
                </Text>
              </Pressable>

              {/* TEXT */}

              <TextInput
                value={followUp}
                onChangeText={
                  setFollowUp
                }
                placeholder="Ask a follow-up..."
                placeholderTextColor="#62748A"
                multiline
                style={
                  styles.followUpInput
                }
                maxLength={1000}
              />

              {/* SEND */}

              <Pressable
                style={[
                  styles.sendButton,
                  (
                    !followUp.trim() &&
                    !imageUri &&
                    !audioUri
                  ) || loading
                    ? styles.disabledButton
                    : null,
                ]}
                onPress={() =>
                  sendMessage(
                    followUp
                  )
                }
                disabled={
                  loading ||
                  (
                    !followUp.trim() &&
                    !imageUri &&
                    !audioUri
                  )
                }
              >
                <Text
                  style={
                    styles.sendText
                  }
                >
                  ➤
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  back: {
    color: "#8FA0B4",
    fontSize: 14,
  },

  badge: {
    color: "#16B8A6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  content: {
    padding: 22,
    paddingBottom: 40,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 20,
  },

  subtitle: {
    color: "#8FA0B4",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },

  inputCard: {
    backgroundColor: "#102235",
    borderRadius: 22,
    padding: 18,
    marginTop: 26,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  inputLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  input: {
    minHeight: 150,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
  },

  counter: {
    color: "#60748A",
    fontSize: 11,
    textAlign: "right",
  },

  methods: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  method: {
    flex: 1,
    backgroundColor: "#0D1B2A",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1A2D40",
  },

  recordingMethod: {
    borderColor: "#EF6B73",
    borderWidth: 2,
  },

  methodIcon: {
    fontSize: 25,
  },

  methodTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 7,
  },

  methodText: {
    color: "#71849A",
    fontSize: 12,
    marginTop: 4,
  },

  voiceReadyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#102235",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  chatImageReady: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#102235",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  voiceReadyText: {
    color: "#16B8A6",
    fontSize: 13,
    fontWeight: "700",
  },

  removeVoice: {
    color: "#EF6B73",
    fontSize: 12,
    fontWeight: "700",
  },

  previewCard: {
    backgroundColor: "#102235",
    borderRadius: 22,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  previewTitle: {
    color: "#16B8A6",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },

  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 14,
  },

  changeButton: {
    marginTop: 12,
    alignItems: "center",
  },

  changeText: {
    color: "#8FA0B4",
    fontSize: 13,
    fontWeight: "600",
  },

  analyzeButton: {
    height: 58,
    borderRadius: 29,
    backgroundColor: "#16B8A6",
    marginTop: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  disabledButton: {
    opacity: 0.45,
  },

  analyzeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 23,
    marginLeft: 12,
  },

  chat: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 20,
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
    borderRadius: 18,
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

  messageRole: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 7,
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 23,
  },

  chatInputArea: {
    backgroundColor: "#0D1B2A",
    borderTopWidth: 1,
    borderTopColor: "#1A2D40",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
  },

  imageButton: {
    width: 44,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#102235",
    alignItems: "center",
    justifyContent: "center",
  },

  voiceButton: {
    width: 44,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#102235",
    alignItems: "center",
    justifyContent: "center",
  },

  recordingButton: {
    backgroundColor: "#EF6B73",
  },

  imageButtonText: {
    fontSize: 20,
  },

  followUpInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    borderRadius: 23,
    backgroundColor: "#102235",
    color: "#FFFFFF",
    paddingHorizontal: 17,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
  },

  sendText: {
    color: "#FFFFFF",
    fontSize: 20,
  },
});