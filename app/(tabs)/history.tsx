import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../supabase";

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

export default function HistoryScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.log("History user error:", userError);
      }

      if (!user) {
        setConversations([]);
        setError("Please login to view your history.");
        return;
      }

      const { data, error: historyError } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (historyError) {
        console.log("History load error:", historyError);
        setError("Unable to load your history.");
        return;
      }

      setConversations(data || []);

      console.log("HISTORY LOADED:", data?.length || 0);
    } catch (err) {
      console.log("Unexpected history error:", err);
      setError("Something went wrong while loading history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Unknown date";
  }

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const itemStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const difference =
    todayStart.getTime() - itemStart.getTime();

  const oneDay = 24 * 60 * 60 * 1000;

  if (difference === 0) {
    return "Today";
  }

  if (difference === oneDay) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
  const openConversation = (conversationId: string) => {
    router.push({
      pathname: "/conversation",
      params: {
        id: conversationId,
      },
    });
  };

  const deleteConversation = (conversationId: string) => {
    Alert.alert(
      "Delete conversation?",
      "This conversation will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error: deleteError } = await supabase
                .from("conversations")
                .delete()
                .eq("id", conversationId);

              if (deleteError) {
                console.log(
                  "DELETE CONVERSATION ERROR:",
                  deleteError
                );

                Alert.alert(
                  "Delete failed",
                  "Could not delete this conversation."
                );

                return;
              }

              setConversations((prev) =>
                prev.filter(
                  (item) =>
                    item.id !== conversationId
                )
              );

              console.log(
                "CONVERSATION DELETED:",
                conversationId
              );
            } catch (err) {
              console.log("DELETE ERROR:", err);

              Alert.alert(
                "Delete failed",
                "Something went wrong."
              );
            }
          },
        },
      ]
    );
  };

  const renderConversation = ({
    item,
  }: {
    item: Conversation;
  }) => {
    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          openConversation(item.id)
        }
        onLongPress={() =>
          deleteConversation(item.id)
        }
      >
        <View style={styles.iconBox}>
          <Text style={styles.icon}>💬</Text>
        </View>

        <View style={styles.cardContent}>
         <Text
  style={styles.cardTitle}
  numberOfLines={2}
>
  {item.title || "Untitled Problem"}
</Text>

<Text style={styles.cardDate}>
  {formatDate(item.created_at)}
</Text>

<Text style={styles.deleteHint}>
  Long press to delete
</Text>
        </View>

        <Text style={styles.arrow}>→</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>
            ✦ FIXLY AI
          </Text>

          <Text style={styles.title}>
            History
          </Text>

          <Text style={styles.subtitle}>
            Your previous problems and AI
            conversations.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#16B8A6"
          />

          <Text style={styles.loadingText}>
            Loading your history...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>
            🔐
          </Text>

          <Text style={styles.emptyTitle}>
            Login required
          </Text>

          <Text style={styles.emptyText}>
            {error}
          </Text>

          <Pressable
            style={styles.loginButton}
            onPress={() =>
              router.push("/login")
            }
          >
            <Text style={styles.loginButtonText}>
              Login
            </Text>
          </Pressable>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>
            📝
          </Text>

          <Text style={styles.emptyTitle}>
            No conversations yet
          </Text>

          <Text style={styles.emptyText}>
            Your solved problems will appear
            here automatically.
          </Text>

          <Pressable
            style={styles.loginButton}
            onPress={() =>
              router.push("/solve")
            }
          >
            <Text style={styles.loginButtonText}>
              Solve a Problem
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                loadHistory(true)
              }
              tintColor="#16B8A6"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 22,
  },

  badge: {
    color: "#16B8A6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 7,
  },

  subtitle: {
    color: "#8FA0B4",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#102235",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#0D1B2A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  icon: {
    fontSize: 23,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },

  cardDate: {
    color: "#71849A",
    fontSize: 12,
    marginTop: 5,
  },

  deleteHint: {
    color: "#53677D",
    fontSize: 10,
    marginTop: 4,
  },

  arrow: {
    color: "#16B8A6",
    fontSize: 22,
    marginLeft: 10,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingBottom: 70,
  },

  loadingText: {
    color: "#8FA0B4",
    fontSize: 14,
    marginTop: 12,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 15,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    color: "#7F91A6",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  loginButton: {
    backgroundColor: "#16B8A6",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 24,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

