import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../assets/styles/theme/useTheme";
import { createStyles } from "../../assets/styles/chat.styles";

const API_URL = "https://edu-guard-backend.onrender.com";

export default function ChatScreen() {
  const { user } = useAuthStore();
  const { receiverId, name } = useLocalSearchParams();
  const router = useRouter();

  const { colors } = useTheme();
  const styles = createStyles(colors);

  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);

  const chatId = [user?._id, receiverId].sort().join("-");

  // =========================================================
  // FORMAT TIME
  // =========================================================
  const formatTime = (date) => {
    if (!date) return "";

    const messageDate = new Date(date);

    if (isNaN(messageDate.getTime())) return "";

    return messageDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =========================================================
  // GET SENDER ID
  // Handles both:
  // sender: "123"
  // sender: { _id: "123" }
  // =========================================================
  const getSenderId = (sender) => {
    if (!sender) return null;

    if (typeof sender === "string") {
      return sender;
    }

    if (typeof sender === "object") {
      return sender._id || sender.id || null;
    }

    return null;
  };

  // =========================================================
  // SCROLL TO BOTTOM
  // =========================================================
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated,
      });
    }, 100);
  };

  // =========================================================
  // LOAD MESSAGES
  // =========================================================
  const loadMessages = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/api/messages/${chatId}`);

      const loadedMessages = Array.isArray(res.data?.messages)
        ? res.data.messages
        : [];

      setMessages(loadedMessages);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: false,
        });
      }, 200);
    } catch (err) {
      console.log("Load messages error:", err.response?.data || err.message);

      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SOCKET CONNECTION
  // =========================================================
  useEffect(() => {
    if (!user?._id || !receiverId) return;

    const socket = io(API_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      setConnected(true);

      socket.emit("register", user._id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");

      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.log("Socket connection error:", error.message);
      setConnected(false);
    });

    socket.on("receive_message", (msg) => {
      if (!msg) return;

      console.log("📩 REALTIME MESSAGE RECEIVED:", msg);

      const senderId = getSenderId(msg.sender);
      const receiverMsgId = getSenderId(msg.receiver);

      const currentUserId = user?._id?.toString();

      const currentReceiverId = receiverId?.toString();

      /* =======================================================
     CHECK IF MESSAGE BELONGS TO CURRENT CHAT
  ======================================================= */

      const isCurrentChat =
        (senderId === currentUserId && receiverMsgId === currentReceiverId) ||
        (senderId === currentReceiverId && receiverMsgId === currentUserId);

      if (!isCurrentChat) {
        console.log("⏭️ Message belongs to another chat");

        return;
      }

      /* =======================================================
     ADD MESSAGE
  ======================================================= */

      setMessages((prev) => {
        /* -----------------------------------------------------
       Check if real message already exists
    ----------------------------------------------------- */

        const alreadyExists = prev.some(
          (message) => message._id?.toString() === msg._id?.toString(),
        );

        if (alreadyExists) {
          return prev;
        }

        /* -----------------------------------------------------
       Remove temporary version of this message
    ----------------------------------------------------- */

        const withoutTemporary = prev.filter((message) => {
          if (!message._id?.toString().startsWith("temp-")) {
            return true;
          }

          const sameSender = getSenderId(message.sender) === senderId;

          const sameReceiver = getSenderId(message.receiver) === receiverMsgId;

          const sameText = message.text === msg.text;

          return !(sameSender && sameReceiver && sameText);
        });

        return [...withoutTemporary, msg];
      });

      /* =======================================================
     SCROLL
  ======================================================= */

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    });

    loadMessages();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("receive_message");

      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, receiverId]);

  // =========================================================
  // SEND MESSAGE
  // =========================================================
  const sendMessage = () => {
    const messageText = text.trim();

    if (!messageText) return;

    if (!user?._id || !receiverId) {
      console.log("❌ Missing user or receiver");
      return;
    }

    if (!socketRef.current?.connected) {
      console.log("❌ Socket is not connected");
      return;
    }

    if (sending) return;

    setSending(true);

    /* =========================================================
     TEMPORARY MESSAGE
     ========================================================= */

    const tempId = `temp-${Date.now()}`;

    const tempMessage = {
      _id: tempId,
      sender: user._id,
      receiver: receiverId,
      text: messageText,
      chatId,
      createdAt: new Date().toISOString(),
      seen: false,
    };

    /* =========================================================
     SHOW MESSAGE IMMEDIATELY
     ========================================================= */

    setMessages((prev) => [...prev, tempMessage]);

    setText("");

    scrollToBottom(true);

    /* =========================================================
     SEND TO SOCKET
     
     DO NOT SEND tempId OR chatId.
     Backend creates the real chatId and MongoDB _id.
     ========================================================= */

    socketRef.current.emit(
      "send_message",
      {
        sender: user._id,
        receiver: receiverId,
        text: messageText,
      },
      (response) => {
        console.log("📨 Send message response:", response);

        if (response?.error) {
          console.log("❌ Message failed:", response.message);

          /* -----------------------------------------------
           Remove temporary message if sending failed
        ------------------------------------------------ */

          setMessages((prev) =>
            prev.filter((message) => message._id !== tempId),
          );

          setText(messageText);
        }

        setSending(false);
      },
    );
  };

  // =========================================================
  // EMPTY STATE
  // =========================================================
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />

          <Text style={styles.emptyTitle}>Loading conversation...</Text>

          <Text style={styles.emptySubtitle}>
            Please wait while your messages are loaded.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIcon,
            {
              backgroundColor: `${colors.primary}15`,
            },
          ]}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={38}
            color={colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>Start a conversation</Text>

        <Text style={styles.emptySubtitle}>
          Send a message to {name || "this user"} to begin your conversation.
        </Text>
      </View>
    );
  };

  // =========================================================
  // RENDER MESSAGE
  // =========================================================
  const renderItem = ({ item }) => {
    const senderId = getSenderId(item.sender);

    const isMe = senderId === user?._id;

    return (
      <View
        style={[
          styles.messageRow,
          {
            justifyContent: isMe ? "flex-end" : "flex-start",
          },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMe ? colors.primary : colors.card,
              borderBottomRightRadius: isMe ? 5 : 18,
              borderBottomLeftRadius: isMe ? 18 : 5,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isMe ? colors.textInverse : colors.text,
              },
            ]}
          >
            {item.text}
          </Text>

          <View style={styles.messageMeta}>
            <Text
              style={[
                styles.messageTime,
                {
                  color: isMe ? "rgba(255,255,255,0.72)" : colors.textSecondary,
                },
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>

            {isMe && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color="rgba(255,255,255,0.72)"
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // =========================================================
  // MAIN UI
  // =========================================================
  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={50}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.chatHeader}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>

          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>

          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName} numberOfLines={1}>
              {name || "Chat"}
            </Text>

            <View style={styles.onlineRow}>
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: connected
                      ? "#4CAF50"
                      : "rgba(255,255,255,0.5)",
                  },
                ]}
              />

              <Text style={styles.chatHeaderStatus}>
                {connected ? "Online" : "Connecting..."}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* =================================================
            MESSAGES
        ================================================= */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) =>
            item._id?.toString() || index.toString()
          }
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyState}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.messagesContainer,
            messages.length === 0 && {
              flexGrow: 1,
            },
          ]}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({
                animated: false,
              });
            }
          }}
        />

        {/* =================================================
            MESSAGE INPUT
        ================================================= */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={2000}
              editable={!sending}
              style={[
                styles.messageInput,
                {
                  color: colors.text,
                },
              ]}
              onSubmitEditing={() => {
                if (Platform.OS !== "ios") {
                  sendMessage();
                }
              }}
            />

            <Text
              style={[
                styles.characterCount,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {text.length}/2000
            </Text>
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  text.trim() && !sending ? colors.primary : colors.border,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons
                name="send"
                size={19}
                color={text.trim() ? colors.textInverse : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
