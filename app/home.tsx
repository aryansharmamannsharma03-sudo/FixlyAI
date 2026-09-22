import React, { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import Sidebar from "../components/Sidebar";

export default function HomeScreen() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                style={styles.menuButton}
                onPress={() => setSidebarVisible(true)}
              >
                <Text style={styles.menuButtonText}>☰</Text>
              </Pressable>

              <View style={styles.headerText}>
                <Text style={styles.smallText}>
                  WELCOME BACK 👋
                </Text>

                <Text style={styles.title}>
                  What can I fix?
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.avatar}
              onPress={() => {
                router.push("/login");
              }}
            >
              <Text style={styles.avatarText}>F</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Tell Fixly AI what's wrong and we'll help you figure it out.
          </Text>

          {/* MR. TERRIFIC ASSISTANT */}
          <Pressable
            style={styles.assistantCard}
            onPress={() => router.push("/assistant")}
          >
            <View style={styles.assistantAvatar}>
              <Text style={styles.assistantAvatarText}>M</Text>
            </View>

            <View style={styles.assistantInfo}>
              <View style={styles.assistantTitleRow}>
                <Text style={styles.assistantTitle}>
                  Mr. Terrific
                </Text>

                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>ONLINE</Text>
                </View>
              </View>

              <Text style={styles.assistantText}>
                Your personal AI assistant • Talk, ask or get things done
              </Text>
            </View>

            <Text style={styles.assistantArrow}>›</Text>
          </Pressable>

          {/* MAIN SOLVE CARD */}
          <View style={styles.mainCard}>
            <Text style={styles.spark}>✦</Text>

            <Text style={styles.cardTitle}>
              What's the problem?
            </Text>

            <Text style={styles.cardText}>
              Upload a screenshot, describe the issue, or tell us what happened.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/solve")}
            >
              <Text style={styles.buttonIcon}>✦</Text>

              <Text style={styles.buttonText}>
                Solve a Problem
              </Text>

              <Text style={styles.arrow}>→</Text>
            </Pressable>
          </View>

          {/* METHODS */}
          <Text style={styles.sectionTitle}>
            Choose how to explain
          </Text>

          <View style={styles.options}>
            <Pressable
              style={styles.option}
              onPress={() => router.push("/solve")}
            >
              <Text style={styles.optionIcon}>📸</Text>

              <Text style={styles.optionTitle}>
                Screenshot
              </Text>

              <Text style={styles.optionText}>
                Show the problem
              </Text>
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => router.push("/solve")}
            >
              <Text style={styles.optionIcon}>✍️</Text>

              <Text style={styles.optionTitle}>
                Type it
              </Text>

              <Text style={styles.optionText}>
                Describe the issue
              </Text>
            </Pressable>

            <Pressable
              style={styles.option}
              onPress={() => router.push("/solve")}
            >
              <Text style={styles.optionIcon}>🎤</Text>

              <Text style={styles.optionTitle}>
                Speak
              </Text>

              <Text style={styles.optionText}>
                Tell us naturally
              </Text>
            </Pressable>
          </View>

          {/* QUICK ACCESS */}
          <Text style={styles.sectionTitle}>
            Quick access
          </Text>

          <View style={styles.quickAccess}>
            <Pressable
              style={styles.quickButton}
              onPress={() => router.push("/(tabs)/history")}
            >
              <Text style={styles.quickIcon}>🕘</Text>

              <View style={styles.quickTextContainer}>
                <Text style={styles.quickTitle}>
                  History
                </Text>

                <Text style={styles.quickSubtitle}>
                  Previous conversations
                </Text>
              </View>

              <Text style={styles.quickArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.quickButton}
              onPress={() => router.push("/tasks")}
            >
              <Text style={styles.quickIcon}>✓</Text>

              <View style={styles.quickTextContainer}>
                <Text style={styles.quickTitle}>
                  Tasks
                </Text>

                <Text style={styles.quickSubtitle}>
                  Your saved tasks
                </Text>
              </View>

              <Text style={styles.quickArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.quickButton}
              onPress={() => router.push("/account")}
            >
              <Text style={styles.quickIcon}>👤</Text>

              <View style={styles.quickTextContainer}>
                <Text style={styles.quickTitle}>
                  Account
                </Text>

                <Text style={styles.quickSubtitle}>
                  Profile & settings
                </Text>
              </View>

              <Text style={styles.quickArrow}>›</Text>
            </Pressable>
          </View>

          {/* TIP */}
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>💡</Text>

            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>
                Pro tip
              </Text>

              <Text style={styles.tipText}>
                The more details you give Fixly AI, the better it can help.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#102235",
    borderWidth: 1,
    borderColor: "#1D3A50",
    alignItems: "center",
    justifyContent: "center",
  },

  menuButtonText: {
    color: "#FFFFFF",
    fontSize: 23,
  },

  headerText: {
    marginLeft: 12,
  },

  smallText: {
    color: "#16B8A6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 4,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  subtitle: {
    color: "#8FA0B4",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    marginBottom: 18,
  },

  /* MR TERRIFIC */

  assistantCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#102235",
    borderRadius: 22,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#16B8A6",
  },

  assistantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
  },

  assistantAvatarText: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  assistantInfo: {
    flex: 1,
    marginLeft: 12,
  },

  assistantTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  assistantTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "#0C2929",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },

  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#16B8A6",
    marginRight: 4,
  },

  onlineText: {
    color: "#16B8A6",
    fontSize: 7,
    fontWeight: "800",
  },

  assistantText: {
    color: "#8496AA",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  assistantArrow: {
    color: "#16B8A6",
    fontSize: 32,
    marginLeft: 7,
  },

  /* MAIN CARD */

  mainCard: {
    backgroundColor: "#102235",
    borderRadius: 26,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  spark: {
    color: "#16B8A6",
    fontSize: 30,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
    marginTop: 10,
  },

  cardText: {
    color: "#91A2B5",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  primaryButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: "#16B8A6",
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    marginRight: 9,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 22,
    marginLeft: 12,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 14,
  },

  options: {
    gap: 10,
  },

  option: {
    backgroundColor: "#0D1B2A",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#1A2D40",
  },

  optionIcon: {
    fontSize: 25,
  },

  optionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 7,
  },

  optionText: {
    color: "#74879D",
    fontSize: 13,
    marginTop: 3,
  },

  quickAccess: {
    gap: 10,
  },

  quickButton: {
    minHeight: 68,
    backgroundColor: "#0D1B2A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1A2D40",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },

  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#102235",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 20,
    overflow: "hidden",
  },

  quickTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  quickTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  quickSubtitle: {
    color: "#71849A",
    fontSize: 12,
    marginTop: 3,
  },

  quickArrow: {
    color: "#16B8A6",
    fontSize: 27,
    marginLeft: 8,
  },

  tip: {
    flexDirection: "row",
    backgroundColor: "#0C1826",
    borderRadius: 18,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#172A3D",
  },

  tipIcon: {
    fontSize: 22,
    marginRight: 12,
  },

  tipContent: {
    flex: 1,
  },

  tipTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  tipText: {
    color: "#75879B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
});