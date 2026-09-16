import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing information", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert("Signup failed", error.message);
          return;
        }

        Alert.alert(
          "Account created",
          "Your account has been created. You can now log in."
        );

        setIsSignup(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert("Login failed", error.message);
          return;
        }

        Alert.alert("Welcome to Fixly AI", "You are now logged in.");
      }
    } catch (error) {
      console.log("Auth error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Fixly AI</Text>

        <Text style={styles.title}>
          {isSignup ? "Create your account" : "Welcome back"}
        </Text>

        <Text style={styles.subtitle}>
          {isSignup
            ? "Create an account to save your problems and history."
            : "Log in to continue with Fixly AI."}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Login"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsSignup(!isSignup)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Sign up"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    elevation: 4,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2563EB",
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  switchButton: {
    marginTop: 20,
    alignItems: "center",
  },
  switchText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },
});