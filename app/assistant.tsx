import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";

import { router } from "expo-router";
import * as Contacts from "expo-contacts";
import * as Speech from "expo-speech";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

import { supabase } from "../supabase";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function AssistantScreen() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text:
        "Hey! I'm Mr. Terrific 🤖\n\nTalk to me normally. Ask me anything, or tell me what you want me to do.",
    },
  ]);

  const scrollRef = useRef<ScrollView>(null);

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      Speech.stop();

      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
    };
  }, []);

  // --------------------------------------------------
  // TEXT TO SPEECH
  // --------------------------------------------------

  const speak = (text: string) => {
    const cleanSpeech = text
      .replace(/[*_#`]/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!cleanSpeech) {
      return;
    }

    Speech.stop();

    const containsHindi = /[\u0900-\u097F]/.test(
      cleanSpeech
    );

    Speech.speak(cleanSpeech, {
      language: containsHindi ? "hi-IN" : "en-IN",
      pitch: 1.0,
      rate: 0.95,
    });
  };

  // --------------------------------------------------
  // ADD CHAT MESSAGE
  // --------------------------------------------------

  const addMessage = (
    role: "user" | "assistant",
    text: string
  ) => {
    setMessages((prev) => [
      ...prev,
      { role, text },
    ]);

    if (role === "assistant") {
      speak(text);
    }

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);
  };

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const cleanText = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.!?,]+$/g, "")
      .replace(/\s+/g, " ");
  };

  const openURL = async (
    url: string,
    fallbackUrl?: string
  ) => {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      if (fallbackUrl) {
        try {
          await Linking.openURL(fallbackUrl);
          return true;
        } catch {
          return false;
        }
      }

      return false;
    }
  };

  const normalizeContactName = (name: string) => {
    return name
      .toLowerCase()
      .replace(
        /[^a-z0-9\u0900-\u097f\s]/gi,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();
  };

  // --------------------------------------------------
  // CONTACT SEARCH
  // --------------------------------------------------

  const findContactNumber = async (
    spokenName: string
  ): Promise<{
    name: string;
    number: string;
  } | null> => {
    try {
      const permission =
        await Contacts.requestPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Contacts Permission",
          "Mr. Terrific needs contacts permission to find people by name."
        );

        return null;
      }

      const { data } =
        await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.PhoneNumbers,
          ],
        });

      const query =
        normalizeContactName(spokenName);

      if (!query) {
        return null;
      }

      let contact = data.find((item) => {
        const name = normalizeContactName(
          item.name || ""
        );

        return name === query;
      });

      if (!contact) {
        contact = data.find((item) => {
          const name = normalizeContactName(
            item.name || ""
          );

          return (
            name.includes(query) ||
            query.includes(name)
          );
        });
      }

      if (!contact) {
        const queryWords =
          query.split(" ");

        contact = data.find((item) => {
          const name = normalizeContactName(
            item.name || ""
          );

          return queryWords.some((word) =>
            name.includes(word)
          );
        });
      }

      if (!contact) {
        return null;
      }

      const number =
        contact.phoneNumbers?.find(
          (phone) => phone.number
        )?.number;

      if (!number) {
        return null;
      }

      return {
        name:
          contact.name || spokenName,
        number: number.replace(
          /[^\d+]/g,
          ""
        ),
      };
    } catch (error) {
      console.log(
        "Contact search error:",
        error
      );

      return null;
    }
  };

  // --------------------------------------------------
  // DIAL NUMBER
  // --------------------------------------------------

  const dialNumber = async (
    number: string
  ) => {
    const cleanNumber =
      number.replace(/[^\d+]/g, "");

    if (!cleanNumber) {
      return false;
    }

    try {
      await Linking.openURL(
        `tel:${cleanNumber}`
      );

      return true;
    } catch (error) {
      console.log(
        "Dialer error:",
        error
      );

      return false;
    }
  };

  // --------------------------------------------------
  // EXTRACT YOUTUBE QUERY
  // --------------------------------------------------

  const extractYouTubeQuery = (
    originalText: string
  ) => {
    let query =
      originalText.trim();

    query = query
      .replace(
        /^(hey\s+)?mr\.?\s*terrific[,\s]*/i,
        ""
      )
      .replace(
        /^(please\s+)?(open|launch|start|go to)\s+/i,
        ""
      )
      .replace(
        /^(youtube|yt)\s*/i,
        ""
      )
      .replace(
        /^(and\s+)?(play|search|find|look for)\s+/i,
        ""
      )
      .replace(
        /\s+(on|in|using)\s+(youtube|yt)\s*$/i,
        ""
      )
      .replace(
        /\s+(youtube|yt)\s*$/i,
        ""
      )
      .trim();

    return query;
  };

  // --------------------------------------------------
  // EXTRACT SPOTIFY QUERY
  // --------------------------------------------------

  const extractSpotifyQuery = (
    originalText: string
  ) => {
    let query =
      originalText.trim();

    query = query
      .replace(
        /^(hey\s+)?mr\.?\s*terrific[,\s]*/i,
        ""
      )
      .replace(
        /^(please\s+)?(open|launch|start|go to)\s+/i,
        ""
      )
      .replace(
        /^(spotify)\s*/i,
        ""
      )
      .replace(
        /^(and\s+)?(play|search|find|look for)\s+/i,
        ""
      )
      .replace(
        /\s+(on|in|using)\s+spotify\s*$/i,
        ""
      )
      .replace(
        /\s+spotify\s*$/i,
        ""
      )
      .trim();

    return query;
  };

  // --------------------------------------------------
  // EXTRACT GOOGLE QUERY
  // --------------------------------------------------

  const extractGoogleQuery = (
    originalText: string
  ) => {
    let query =
      originalText.trim();

    query = query
      .replace(
        /^(hey\s+)?mr\.?\s*terrific[,\s]*/i,
        ""
      )
      .replace(
        /^(please\s+)?open\s+google\s*/i,
        ""
      )
      .replace(
        /^(please\s+)?google\s*/i,
        ""
      )
      .replace(
        /^(and\s+)?(search|find|look for)\s+/i,
        ""
      )
      .replace(
        /^search\s+(for\s+)?/i,
        ""
      )
      .trim();

    return query;
  };

  // --------------------------------------------------
  // MR. TERRIFIC ACTION ENGINE
  // --------------------------------------------------

  const handleAction = async (
    text: string
  ): Promise<boolean> => {
    const lower = cleanText(text);

    // ==================================================
    // PHONE NUMBER
    // ==================================================

    const phoneMatch = text.match(
      /(?:call|phone|dial|contact)\s*(?:me\s*)?(?:number\s*)?(\+?\d[\d\s-]{7,}\d)/i
    );

    if (phoneMatch) {
      const number =
        phoneMatch[1].replace(
          /[^\d+]/g,
          ""
        );

      const success =
        await dialNumber(number);

      if (success) {
        addMessage(
          "assistant",
          `Opening the dialer for ${number} 📞`
        );
      } else {
        addMessage(
          "assistant",
          "I couldn't open the phone dialer on this device. ⚠️"
        );
      }

      return true;
    }

    // ==================================================
    // WHATSAPP
    // ==================================================

    const whatsappOnly =
      lower === "whatsapp" ||
      lower === "open whatsapp" ||
      lower === "whatsapp open" ||
      lower === "whatsapp kholo" ||
      lower === "open whats app" ||
      lower === "whats app kholo";

    if (whatsappOnly) {
      const success = await openURL(
        "whatsapp://",
        "https://www.whatsapp.com/"
      );

      if (success) {
        addMessage(
          "assistant",
          "Opening WhatsApp 💬"
        );
      } else {
        addMessage(
          "assistant",
          "I couldn't open WhatsApp. Please make sure WhatsApp is installed. ⚠️"
        );
      }

      return true;
    }

    // ==================================================
    // YOUTUBE SEARCH / PLAY
    // ==================================================

    const mentionsYouTube =
      /\b(youtube|yt)\b/i.test(
        lower
      );

    const hasYouTubeAction =
      /\b(play|search|find|look for)\b/i.test(
        lower
      );

    if (
      mentionsYouTube &&
      hasYouTubeAction
    ) {
      const query =
        extractYouTubeQuery(text);

      if (query) {
        const youtubeSearch =
          `https://www.youtube.com/results?search_query=${encodeURIComponent(
            query
          )}`;

        const success =
          await openURL(
            youtubeSearch
          );

        if (success) {
          addMessage(
            "assistant",
            `Searching YouTube for "${query}" ▶️`
          );
        } else {
          addMessage(
            "assistant",
            "I couldn't open YouTube right now. ⚠️"
          );
        }

        return true;
      }
    }

    // ==================================================
    // OPEN YOUTUBE ONLY
    // ==================================================

    if (
      lower === "youtube" ||
      lower === "open youtube" ||
      lower === "youtube open" ||
      lower === "youtube kholo" ||
      lower === "open yt" ||
      lower === "yt kholo"
    ) {
      const success =
        await openURL(
          "https://www.youtube.com"
        );

      if (success) {
        addMessage(
          "assistant",
          "Opening YouTube ▶️"
        );
      } else {
        addMessage(
          "assistant",
          "I couldn't open YouTube right now. ⚠️"
        );
      }

      return true;
    }

    // ==================================================
    // SPOTIFY SEARCH / PLAY
    // ==================================================

    const mentionsSpotify =
      /\bspotify\b/i.test(
        lower
      );

    const hasSpotifyAction =
      /\b(play|search|find|look for)\b/i.test(
        lower
      );

    if (
      mentionsSpotify &&
      hasSpotifyAction
    ) {
      const query =
        extractSpotifyQuery(text);

      if (query) {
        const spotifyAppUrl =
          `spotify:search:${encodeURIComponent(
            query
          )}`;

        const spotifyWebUrl =
          `https://open.spotify.com/search/${encodeURIComponent(
            query
          )}`;

        const success =
          await openURL(
            spotifyAppUrl,
            spotifyWebUrl
          );

        if (success) {
          addMessage(
            "assistant",
            `Searching Spotify for "${query}" 🎵`
          );
        } else {
          addMessage(
            "assistant",
            "I couldn't open Spotify right now. ⚠️"
          );
        }

        return true;
      }
    }

    // ==================================================
    // OPEN SPOTIFY ONLY
    // ==================================================

    if (
      lower === "spotify" ||
      lower === "open spotify" ||
      lower === "spotify open" ||
      lower === "spotify kholo"
    ) {
      const success =
        await openURL(
          "spotify://",
          "https://open.spotify.com"
        );

      if (success) {
        addMessage(
          "assistant",
          "Opening Spotify 🎵"
        );
      } else {
        addMessage(
          "assistant",
          "I couldn't open Spotify right now. ⚠️"
        );
      }

      return true;
    }

    // ==================================================
    // INSTAGRAM SEARCH
    // ==================================================

    const mentionsInstagram =
      /\binstagram\b|\binsta\b/i.test(
        lower
      );

    const hasInstagramSearch =
      /\b(search|find|look for|open)\b/i.test(
        lower
      );

    if (
      mentionsInstagram &&
      hasInstagramSearch &&
      lower !== "open instagram" &&
      lower !== "instagram open" &&
      lower !== "instagram kholo"
    ) {
      let query =
        text
          .replace(
            /^(please\s+)?(open|search|find|look for)\s+/i,
            ""
          )
          .replace(
            /^(instagram|insta)\s*/i,
            ""
          )
          .replace(
            /^(and\s+)?(search|find|look for|open)\s+/i,
            ""
          )
          .replace(
            /\s+(on|in|using)\s+(instagram|insta)\s*$/i,
            ""
          )
          .replace(
            /\s+(instagram|insta)\s*$/i,
            ""
          )
          .trim();

      if (query.startsWith("@")) {
        query =
          query.substring(1);
      }

      if (query) {
        const looksLikeUsername =
          /^[a-zA-Z0-9._]+$/.test(
            query
          );

        if (looksLikeUsername) {
          const profileUrl =
            `https://www.instagram.com/${encodeURIComponent(
              query
            )}/`;

          const success =
            await openURL(
              profileUrl
            );

          if (success) {
            addMessage(
              "assistant",
              `Opening Instagram profile "${query}" 📸`
            );
          } else {
            addMessage(
              "assistant",
              "I couldn't open that Instagram profile. ⚠️"
            );
          }
        } else {
          const searchUrl =
            `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(
              query
            )}`;

          const fallbackUrl =
            `https://www.google.com/search?q=${encodeURIComponent(
              query + " Instagram"
            )}`;

          const success =
            await openURL(
              searchUrl,
              fallbackUrl
            );

          if (success) {
            addMessage(
              "assistant",
              `Searching Instagram for "${query}" 📸`
            );
          } else {
            addMessage(
              "assistant",
              "I couldn't search Instagram right now. ⚠️"
            );
          }
        }

        return true;
      }
    }

    // ==================================================
    // OPEN INSTAGRAM ONLY
    // ==================================================

    if (
      lower === "instagram" ||
      lower === "open instagram" ||
      lower === "instagram open" ||
      lower === "instagram kholo" ||
      lower === "open insta" ||
      lower === "insta kholo"
    ) {
      const success =
        await openURL(
          "instagram://app",
          "https://www.instagram.com"
        );

      if (success) {
        addMessage(
          "assistant",
          "Opening Instagram 📸"
        );
      } else {
        addMessage(
          "assistant",
          "I couldn't open Instagram right now. ⚠️"
        );
      }

      return true;
    }

    // ==================================================
    // GOOGLE: "OPEN GOOGLE AND SEARCH PYTHON"
    // ==================================================

    const googleCombinedMatch =
      text.match(
        /^(?:please\s+)?(?:open\s+)?google\s+(?:and\s+)?(?:search|find|look\s+for)\s+(.+)$/i
      );

    if (googleCombinedMatch) {
      const query =
        googleCombinedMatch[1].trim();

      if (query) {
        const url =
          `https://www.google.com/search?q=${encodeURIComponent(
            query
          )}`;

        const success =
          await openURL(url);

        if (success) {
          addMessage(
            "assistant",
            `Searching Google for "${query}" 🔎`
          );
        } else {
          addMessage(
            "assistant",
            "I couldn't open Google right now. ⚠️"
          );
        }

        return true;
      }
    }

    // ==================================================
    // GOOGLE SEARCH
    // ==================================================

    const googleSearchMatch =
      text.match(
        /^(?:please\s+)?(?:google\s+)?search(?:\s+for)?\s+(.+)$/i
      );

    if (googleSearchMatch) {
      const query =
        googleSearchMatch[1].trim();

      if (query) {
        const url =
          `https://www.google.com/search?q=${encodeURIComponent(
            query
          )}`;

        const success =
          await openURL(url);

        if (success) {
          addMessage(
            "assistant",
            `Searching Google for "${query}" 🔎`
          );
        } else {
          addMessage(
            "assistant",
            "I couldn't open Google right now. ⚠️"
          );
        }

        return true;
      }
    }

    // ==================================================
    // GOOGLE: SEARCH X ON GOOGLE
    // ==================================================

    const searchOnGoogleMatch =
      text.match(
        /^(?:please\s+)?(?:search|find|look\s+for)\s+(.+?)\s+(?:on|in|using)\s+google$/i
      );

    if (searchOnGoogleMatch) {
      const query =
        searchOnGoogleMatch[1].trim();

      if (query) {
        const url =
          `https://www.google.com/search?q=${encodeURIComponent(
            query
          )}`;

        const success =
          await openURL(url);

        if (success) {
          addMessage(
            "assistant",
            `Searching Google for "${query}" 🔎`
          );
        } else {
          addMessage(
            "assistant",
            "I couldn't open Google right now. ⚠️"
          );
        }

        return true;
      }
    }

    // ==================================================
    // OPEN GOOGLE ONLY
    // ==================================================

    if (
      lower === "google" ||
      lower === "open google" ||
      lower === "google open" ||
      lower === "google kholo"
    ) {
      const success =
        await openURL(
          "https://www.google.com"
        );

      if (success) {
        addMessage(
          "assistant",
          "Opening Google 🔎"
        );
      } else {
        addMessage(
          "assistant",
          "I couldn't open Google right now. ⚠️"
        );
      }

      return true;
    }

    // ==================================================
    // CONTACT / PERSON SEARCH
    // ==================================================

    const contactCommand =
      /\b(call|phone|dial|contact|open|find|search)\b/i.test(
        lower
      ) &&
      /\b(mummy|mom|mama|mother|papa|dad|father|brother|sister|bhai|behen|uncle|aunty|friend|contact|person|dialer|phone)\b/i.test(
        lower
      );

    if (contactCommand) {
      let contactName =
        text
          .replace(
            /^(please\s+)?/i,
            ""
          )
          .replace(
            /\b(open|call|phone|dial|contact|find|search)\b/gi,
            " "
          )
          .replace(
            /\b(dialer|phone|contact|number)\b/gi,
            " "
          )
          .replace(
            /\b(and|in|on|for|the|my|me)\b/gi,
            " "
          )
          .trim();

      if (contactName) {
        const contact =
          await findContactNumber(
            contactName
          );

        if (contact) {
          const success =
            await dialNumber(
              contact.number
            );

          if (success) {
            addMessage(
              "assistant",
              `Opening ${contact.name}'s number in the dialer 📞`
            );
          } else {
            addMessage(
              "assistant",
              `I found ${contact.name}, but couldn't open the dialer. ⚠️`
            );
          }

          return true;
        }

        addMessage(
          "assistant",
          `I couldn't find a contact matching "${contactName}". Please check the saved contact name.`
        );

        return true;
      }
    }

    // ==================================================
    // OPEN DIALER
    // ==================================================

    if (
      lower === "open dialer" ||
      lower === "dialer open" ||
      lower === "dialer kholo" ||
      lower === "open phone" ||
      lower === "phone kholo" ||
      lower === "open phone dialer"
    ) {
      try {
        await Linking.openURL(
          "tel:"
        );

        addMessage(
          "assistant",
          "Opening the phone dialer 📞"
        );
      } catch {
        addMessage(
          "assistant",
          "I couldn't open the phone dialer on this device. ⚠️"
        );
      }

      return true;
    }

    // ==================================================
    // CAMERA
    // ==================================================

    if (
      lower === "open camera" ||
      lower === "camera kholo" ||
      lower === "camera open"
    ) {
      addMessage(
        "assistant",
        "Camera control can be connected next. 📷"
      );

      return true;
    }

    return false;
  };

  // --------------------------------------------------
  // GEMINI / SUPABASE
  // --------------------------------------------------

  const askMrTerrific = async (
    text: string
  ) => {
    try {
      setLoading(true);

      const { data, error } =
        await supabase.functions.invoke(
          "analyze-problem",
          {
            body: {
              message: text,
              prompt: text,
              problem: text,
              mode: "assistant",
              assistant: "Mr. Terrific",
            },
          }
        );

      if (error) {
        console.log(
          "Supabase function error:",
          error
        );

        throw new Error(
          error.message ||
            "Backend request failed"
        );
      }

      let answerText =
        data?.answer ||
        data?.response ||
        data?.text ||
        data?.message ||
        data?.result ||
        data?.content ||
        "";

      if (
        typeof answerText ===
        "string"
      ) {
        try {
          const parsed =
            JSON.parse(answerText);

          if (parsed?.answer) {
            answerText =
              parsed.answer;
          }
        } catch {
          // Already normal text.
        }
      }

      const answer =
        String(answerText).trim();

      if (!answer) {
        throw new Error(
          "The AI returned an empty response."
        );
      }

      addMessage(
        "assistant",
        answer
      );
    } catch (error) {
      console.log(
        "Mr. Terrific error:",
        error
      );

      addMessage(
        "assistant",
        "Sorry bhai, I couldn't connect to my AI brain right now. Please try again. ⚠️"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------

  const sendMessage = async (
    inputText?: string
  ) => {
    const text =
      (inputText ?? message).trim();

    if (!text || loading) {
      return;
    }

    setMessage("");

    addMessage(
      "user",
      text
    );

    const actionHandled =
      await handleAction(text);

    if (actionHandled) {
      return;
    }

    await askMrTerrific(text);
  };

  // --------------------------------------------------
  // SPEECH RECOGNITION EVENTS
  // --------------------------------------------------

  useSpeechRecognitionEvent(
    "start",
    () => {
      setIsListening(true);
    }
  );

  useSpeechRecognitionEvent(
    "end",
    () => {
      setIsListening(false);
    }
  );

  useSpeechRecognitionEvent(
    "result",
    (event) => {
      const transcript =
        event.results?.[0]?.transcript?.trim();

      if (!transcript) {
        return;
      }

      setIsListening(false);

      void sendMessage(
        transcript
      );
    }
  );

  useSpeechRecognitionEvent(
    "error",
    (event) => {
      console.log(
        "Speech recognition error:",
        event.error,
        event.message
      );

      setIsListening(false);

      if (
        event.error ===
        "not-allowed"
      ) {
        Alert.alert(
          "Microphone Permission",
          "Please allow microphone permission for FixlyAI and try again."
        );
      } else {
        addMessage(
          "assistant",
          "I couldn't understand the voice command. Please try again. 🎤"
        );
      }
    }
  );

  // --------------------------------------------------
  // VOICE BUTTON
  // --------------------------------------------------

  const handleVoice = async () => {
    if (loading) {
      return;
    }

    if (isListening) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (error) {
        console.log(
          "Speech stop error:",
          error
        );
      }

      setIsListening(false);
      return;
    }

    try {
      // Stop any previous Mr. Terrific voice.
      Speech.stop();

      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Microphone Permission",
          "Mr. Terrific needs microphone permission to listen to your commands."
        );

        return;
      }

      setIsListening(true);

      ExpoSpeechRecognitionModule.start({
        lang: "en-IN",
        interimResults: false,
        continuous: false,
      });
    } catch (error) {
      console.log(
        "Speech start error:",
        error
      );

      setIsListening(false);

      Alert.alert(
        "Voice Error",
        "Voice recognition couldn't start. Please try again."
      );
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              M
            </Text>
          </View>

          <View>
            <Text style={styles.name}>
              Mr. Terrific
            </Text>

            <Text style={styles.status}>
              ● Online • Your AI Assistant
            </Text>
          </View>
        </View>

        <View style={styles.headerSpace} />
      </View>

      {/* CHAT */}

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={
          styles.chatContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(
          (item, index) => (
            <View
              key={index}
              style={[
                styles.messageRow,
                item.role === "user" &&
                  styles.userRow,
              ]}
            >
              {item.role ===
                "assistant" && (
                <View
                  style={
                    styles.smallAvatar
                  }
                >
                  <Text
                    style={
                      styles.smallAvatarText
                    }
                  >
                    M
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  item.role === "user"
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={
                    styles.messageText
                  }
                >
                  {item.text}
                </Text>
              </View>
            </View>
          )
        )}

        {loading && (
          <View style={styles.messageRow}>
            <View
              style={styles.smallAvatar}
            >
              <Text
                style={
                  styles.smallAvatarText
                }
              >
                M
              </Text>
            </View>

            <View
              style={
                styles.assistantBubble
              }
            >
              <View
                style={styles.typingRow}
              >
                <ActivityIndicator
                  size="small"
                  color="#16B8A6"
                />

                <Text
                  style={styles.typingText}
                >
                  Mr. Terrific is thinking...
                </Text>
              </View>
            </View>
          </View>
        )}

        {isListening && (
          <View
            style={styles.voiceStatusRow}
          >
            <View
              style={
                styles.voiceStatusBubble
              }
            >
              <Text
                style={
                  styles.voiceStatusText
                }
              >
                🎤 Listening... Speak your command
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* INPUT AREA */}

      <View style={styles.inputArea}>
        <Pressable
          style={[
            styles.voiceButton,
            isListening &&
              styles.voiceButtonActive,
          ]}
          onPress={handleVoice}
          disabled={loading}
        >
          <Text style={styles.voiceIcon}>
            {isListening
              ? "⏹️"
              : "🎤"}
          </Text>
        </Pressable>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={
            isListening
              ? "Listening..."
              : "Talk to Mr. Terrific..."
          }
          placeholderTextColor="#71849A"
          style={styles.input}
          multiline
          editable={
            !loading &&
            !isListening
          }
        />

        <Pressable
          style={[
            styles.sendButton,
            (!message.trim() ||
              loading ||
              isListening) &&
              styles.sendButtonDisabled,
          ]}
          onPress={() =>
            void sendMessage()
          }
          disabled={
            !message.trim() ||
            loading ||
            isListening
          }
        >
          <Text style={styles.sendIcon}>
            ➤
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
  },

  header: {
    height: 90,
    paddingTop: 35,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#162B3D",
    backgroundColor: "#0B1827",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#102235",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 35,
    marginTop: -3,
  },

  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },

  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  status: {
    color: "#16B8A6",
    fontSize: 10,
    marginTop: 2,
  },

  headerSpace: {
    width: 42,
  },

  chat: {
    flex: 1,
  },

  chatContent: {
    padding: 18,
    paddingBottom: 25,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 15,
  },

  userRow: {
    justifyContent: "flex-end",
  },

  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  smallAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 18,
  },

  assistantBubble: {
    backgroundColor: "#102235",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  userBubble: {
    backgroundColor: "#16B8A6",
    borderBottomRightRadius: 5,
  },

  messageText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
  },

  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  typingText: {
    color: "#9DB0C2",
    fontSize: 13,
  },

  voiceStatusRow: {
    alignItems: "center",
    marginBottom: 10,
  },

  voiceStatusBubble: {
    backgroundColor: "#102235",
    borderWidth: 1,
    borderColor: "#16B8A6",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  voiceStatusText: {
    color: "#16B8A6",
    fontSize: 13,
    fontWeight: "700",
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom:
      Platform.OS === "ios"
        ? 20
        : 12,
    backgroundColor: "#0B1827",
    borderTopWidth: 1,
    borderTopColor: "#162B3D",
    gap: 8,
  },

  voiceButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#102235",
    borderWidth: 1,
    borderColor: "#1D3A50",
    alignItems: "center",
    justifyContent: "center",
  },

  voiceButtonActive: {
    backgroundColor: "#163D4A",
    borderColor: "#16B8A6",
  },

  voiceIcon: {
    fontSize: 20,
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    borderRadius: 23,
    backgroundColor: "#102235",
    borderWidth: 1,
    borderColor: "#1D3A50",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
  },

  sendButtonDisabled: {
    opacity: 0.35,
  },

  sendIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
});