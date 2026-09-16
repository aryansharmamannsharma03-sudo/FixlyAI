import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../supabase";

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
};

export default function Sidebar({
  visible,
  onClose,
}: SidebarProps) {
  const goTo = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const newChat = () => {
    onClose();
    router.push("/solve");
  };

  const logout = async () => {
    onClose();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("LOGOUT ERROR:", error);
      return;
    }

    router.replace("/login");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
        />

        <SafeAreaView style={styles.sidebar}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>F</Text>
            </View>

            <View>
              <Text style={styles.brand}>Fixly AI</Text>
              <Text style={styles.tagline}>
                Smart help, simply.
              </Text>
            </View>
          </View>

          {/* New Chat */}
          <Pressable
            style={styles.newChat}
            onPress={newChat}
          >
            <Text style={styles.newChatIcon}>✦</Text>
            <Text style={styles.newChatText}>
              New Chat
            </Text>
            <Text style={styles.plus}>＋</Text>
          </Pressable>

          {/* Main Navigation */}
          <Text style={styles.sectionLabel}>
            YOUR FIXLY
          </Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => goTo("/history")}
          >
            <Text style={styles.menuIcon}>🕘</Text>
            <Text style={styles.menuText}>
              History
            </Text>
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => goTo("/tasks")}
          >
            <Text style={styles.menuIcon}>✓</Text>
            <Text style={styles.menuText}>
              Tasks
            </Text>
          </Pressable>
{/* Settings */}
<Pressable
  style={styles.menuItem}
  onPress={() => goTo("/settings")}
>
  <Text style={styles.menuIcon}>⚙️</Text>
  <Text style={styles.menuText}>
    Settings
  </Text>
</Pressable>
          {/* Bottom */}
          <View style={styles.bottom}>
            <Pressable
              style={styles.menuItem}
              onPress={() => goTo("/account")}
            >
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuText}>
                Account
              </Text>
            </Pressable>

            <Pressable
              style={styles.logout}
              onPress={logout}
            >
              <Text style={styles.logoutIcon}>↪</Text>
              <Text style={styles.logoutText}>
                Log out
              </Text>
            </Pressable>

            <Text style={styles.version}>
              Fixly AI • v1.0
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  sidebar: {
    width: 300,
    backgroundColor: "#07111F",
    borderRightWidth: 1,
    borderRightColor: "#1D3A50",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 15,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    marginBottom: 25,
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  tagline: {
    color: "#71849A",
    fontSize: 11,
    marginTop: 2,
  },

  newChat: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#16B8A6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 28,
  },

  newChatIcon: {
    color: "#FFFFFF",
    fontSize: 19,
    marginRight: 11,
  },

  newChatText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  plus: {
    color: "#FFFFFF",
    fontSize: 23,
  },

  sectionLabel: {
    color: "#53677D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 8,
    paddingHorizontal: 8,
  },

  menuItem: {
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 5,
  },

  menuIcon: {
    width: 32,
    color: "#FFFFFF",
    fontSize: 20,
    textAlign: "center",
  },

  menuText: {
    color: "#DCE5EF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 7,
  },

  bottom: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#172A3D",
    paddingTop: 12,
  },

  logout: {
    height: 46,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  logoutIcon: {
    color: "#EF6B73",
    fontSize: 21,
    width: 32,
    textAlign: "center",
  },

  logoutText: {
    color: "#EF6B73",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 7,
  },

  version: {
    color: "#40546A",
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
  },
});