import React, { useEffect, useRef } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  StatusBar,
} from "react-native";

export default function HomeScreen() {
  const scale = useRef(new Animated.Value(0.65)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        delay: 500,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotateY = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-18deg", "0deg"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity,
            transform: [
              { perspective: 900 },
              { scale },
              { rotateY },
            ],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>F</Text>
        </View>

        <Text style={styles.title}>Fixly AI</Text>

        <Text style={styles.tagline}>
          Show me the problem.{'\n'}
          <Text style={styles.highlight}>I'll show you what to do next.</Text>
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardIcon}>✦</Text>
          <Text style={styles.cardTitle}>Your AI Problem Solver</Text>
          <Text style={styles.cardText}>
            Screenshot it, type it, or tell us what happened.
            Fixly AI will explain the problem and guide you step by step.
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
         <Pressable
  style={styles.button}
  onPress={() => router.replace("/home")}
>
  <Text style={styles.buttonText}>Get Started</Text>
  <Text style={styles.arrow}>→</Text>
</Pressable>
        </Animated.View>
      </Animated.View>

      <Text style={styles.bottomText}>AI-powered • Simple • Fast</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  content: {
    width: "100%",
    alignItems: "center",
  },

  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#16B8A6",
    shadowOpacity: 0.45,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  logoText: {
    color: "#FFFFFF",
    fontSize: 46,
    fontWeight: "900",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1,
  },

  tagline: {
    color: "#AEBACB",
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    marginTop: 10,
  },

  highlight: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  card: {
    width: "100%",
    backgroundColor: "#101D2D",
    borderRadius: 24,
    padding: 22,
    marginTop: 34,
    borderWidth: 1,
    borderColor: "#1D3147",
  },

  cardIcon: {
    color: "#16B8A6",
    fontSize: 28,
    marginBottom: 8,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  cardText: {
    color: "#9AA9BB",
    fontSize: 14,
    lineHeight: 21,
  },

  button: {
    marginTop: 24,
    backgroundColor: "#16B8A6",
    minWidth: 220,
    height: 58,
    borderRadius: 29,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    elevation: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 24,
    marginLeft: 12,
    marginTop: -2,
  },

  bottomText: {
    position: "absolute",
    bottom: 28,
    color: "#64748B",
    fontSize: 12,
  },
});