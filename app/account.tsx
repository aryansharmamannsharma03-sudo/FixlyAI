import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../supabase";

export default function AccountScreen() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadAccount = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.log("ACCOUNT USER ERROR:", error);
        return;
      }

      if (!user) {
        setEmail("");
        setUserId("");
        return;
      }

      setEmail(user.email || "No email available");
      setUserId(user.id);

      console.log("ACCOUNT USER:", user.id);
    } catch (error) {
      console.log("ACCOUNT LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [])
  );

  const logout = async () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);

              const { error } = await supabase.auth.signOut();

              if (error) {
                console.log("LOGOUT ERROR:", error);
                Alert.alert(
                  "Logout failed",
                  "Unable to log out. Please try again."
                );
                return;
              }

              console.log("LOGOUT SUCCESS");

              router.replace("/login");
            } catch (error) {
              console.log("LOGOUT ERROR:", error);
              Alert.alert(
                "Logout failed",
                "Something went wrong."
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
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
          Loading account...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>✦ FIXLY AI</Text>

        <Text style={styles.title}>Account</Text>

        <Text style={styles.subtitle}>
          Manage your Fixly AI account.
        </Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {email ? email.charAt(0).toUpperCase() : "F"}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileLabel}>
            Signed in as
          </Text>

          <Text style={styles.email}>
            {email || "Not logged in"}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Account information
        </Text>

        <Text style={styles.infoLabel}>
          Email
        </Text>

        <Text style={styles.infoValue}>
          {email || "Not available"}
        </Text>

        <Text style={styles.infoLabel}>
          User ID
        </Text>

        <Text
          style={styles.userId}
          numberOfLines={1}
        >
          {userId || "Not available"}
        </Text>
      </View>

      <Pressable
        style={[
          styles.logoutButton,
          loggingOut && styles.disabledButton,
        ]}
        onPress={logout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color="#FF6B6B" />
        ) : (
          <Text style={styles.logoutText}>
            Log Out
          </Text>
        )}
      </Pressable>

      <Text style={styles.version}>
        Fixly AI • Your AI problem-solving assistant
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
    paddingHorizontal: 20,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 25,
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

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#102235",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },

  profileInfo: {
    flex: 1,
  },

  profileLabel: {
    color: "#71849A",
    fontSize: 12,
  },

  email: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 5,
  },

  infoCard: {
    backgroundColor: "#0D1B2A",
    borderRadius: 20,
    padding: 18,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#1A2D40",
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 17,
  },

  infoLabel: {
    color: "#71849A",
    fontSize: 12,
    marginTop: 8,
  },

  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 4,
  },

  userId: {
    color: "#71849A",
    fontSize: 11,
    marginTop: 4,
  },

  logoutButton: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  logoutText: {
    color: "#FF6B6B",
    fontSize: 15,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },

  center: {
    flex: 1,
    backgroundColor: "#07111F",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#8FA0B4",
    fontSize: 14,
    marginTop: 12,
  },

  version: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    color: "#53677D",
    fontSize: 11,
    textAlign: "center",
  },
});