import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig'; // Your Firebase config
import { Message, Profile } from '../../../types'; // Your types
import rules from '../data/rules.json'; // Your offline rules

const CHATBOT_API_URL = "https://ann-dhan-api.onrender.com/api/chat"; // 👈 Your live backend URL

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const [profile, setProfile] = useState<Profile>({});

  // Fetch profile and chat history on component load
  useEffect(() => {
    const loadData = async () => {
      // Load user profile from local storage for crop/language context
      const rawProfile = await AsyncStorage.getItem('profile');
      if (rawProfile) setProfile(JSON.parse(rawProfile));

      // Load chat history from Firebase
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, 'users', user.uid, 'chats'), orderBy('ts'));
        const snap = await getDocs(q);
        const chats = snap.docs.map(doc => doc.data() as Message);
        if (chats.length > 0) {
          setMessages(chats);
        } else {
          pushBot("Namaste 🙏! I am Ann Dhan. Ask me about your crop, irrigation, or pests.");
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const pushBot = async (text: string) => {
    const msg: Message = { id: Date.now().toString(), from: 'bot', text, ts: Date.now() };
    setMessages(prev => [...prev, msg]);
    await saveToFirestore(msg);
    scrollToBottom();
  };

  const pushUser = async (text: string) => {
    const msg: Message = { id: Date.now().toString(), from: 'user', text, ts: Date.now() };
    setMessages(prev => [...prev, msg]);
    await saveToFirestore(msg);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 200);
  };

  const ruleAnswer = (q: string): string | null => {
    const question = q.toLowerCase();
    const cropRules = rules[profile.crop?.toLowerCase() as keyof typeof rules] || {};
    const globalRules = rules.global || {};

    for (let key in cropRules) {
      if (question.includes(key)) return cropRules[key as keyof typeof cropRules];
    }
    for (let key in globalRules) {
      if (question.includes(key)) return globalRules[key as keyof typeof globalRules];
    }
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    await pushUser(userText);

    const localAns = ruleAnswer(userText);
    if (localAns) {
      pushBot(localAns);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText, crop: profile.crop, history: messages }),
      });
      const data = await response.json();
      pushBot(data.answer || 'Sorry, I don’t know this yet.');
    } catch (e) {
      console.error('Chat error:', e);
      pushBot('Network error, please try again later 🙏');
    } finally {
      setLoading(false);
    }
  };

  const saveToFirestore = async (msg: Message) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, 'users', user.uid, 'chats'), msg);
      }
    } catch (e) {
      console.error('Firestore save error', e);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.from === 'user' ? styles.userBubble : styles.botBubble]}>
      <Text>{item.text}</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={styles.loadingIndicator} size="large" color="green" />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
      />
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Ask me anything..."
          value={input}
          onChangeText={setInput}
          style={styles.textInput}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f8f8f8' },
  loadingIndicator: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageBubble: { padding: 10, marginVertical: 5, borderRadius: 12, maxWidth: '80%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#d4f7dc' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  textInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 24 },
  sendButton: { marginLeft: 5, backgroundColor: 'green', padding: 12, borderRadius: 24 },
  sendButtonText: { color: 'white' }
});