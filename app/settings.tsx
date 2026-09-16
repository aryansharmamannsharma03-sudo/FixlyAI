import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { router } from "expo-router";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.badge}>✦ FIXLY AI</Text>

      <Text style={styles.title}>Settings</Text>

      <Text style={styles.subtitle}>
        Manage your Fixly AI preferences.
      </Text>

      <View style={styles.card}>
        <Text style={styles.icon}>⚙️</Text>

        <Text style={styles.cardTitle}>
          App Settings
        </Text>

        <Text style={styles.cardText}>
          More customization options will be added
          here as Fixly AI grows.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
    padding: 20,
    paddingTop: 55,
  },

  backButton: {
    marginBottom: 25,
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

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 7,
  },

  subtitle: {
    color: "#8FA0B4",
    fontSize: 14,
    marginTop: 7,
  },

  card: {
    backgroundColor: "#102235",
    borderRadius: 20,
    padding: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  icon: {
    fontSize: 30,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },

  cardText: {
    color: "#8FA0B4",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
});