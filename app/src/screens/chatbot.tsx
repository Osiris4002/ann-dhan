// src/screens/ChatScreen.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import rules from '../data/rules.json';
import { auth, db } from '../firebaseConfig';
import { Message, Profile } from '../types'; // Adjust path as needed

// TODO: Replace with your backend URL
const BACKEND_URL = 'https://your-render-app.onrender.com/api/chat';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const [profile, setProfile] = useState<Profile>({});

  useEffect(() => {
    const loadData = async () => {
      // Load user profile from local storage
      const rawProfile = await AsyncStorage.getItem('profile');
      if (rawProfile) {
        setProfile(JSON.parse(rawProfile));
      }

      // Load chat history from Firebase
      const user = auth.currentUser || { uid: 'demo' };
      const q = query(collection(db, 'profiles', user.uid, 'chats'), orderBy('ts'));
      const snap = await getDocs(q);
      const chats = snap.docs.map(doc => doc.data() as Message);
      
      if (chats.length > 0) {
        setMessages(chats);
      } else {
        pushBot('Namaste 🙏! I am Ann Dhan. Ask me about your crop, irrigation, or pests.');
      }
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
    const globalRules = rules.global;

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
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          crop: profile.crop || 'general',
          language: profile.language || 'en',
        }),
      });
      const data = await res.json();
      pushBot(data.answer || 'Sorry, I don’t know this yet.');
    } catch (e) {
      console.log('Chat error:', e);
      pushBot('Network error, please try again later 🙏');
    } finally {
      setLoading(false);
    }
  };

  const saveToFirestore = async (msg: Message) => {
    try {
      const user = auth.currentUser || { uid: 'demo' };
      await addDoc(collection(db, 'profiles', user.uid, 'chats'), {
        from: msg.from,
        text: msg.text,
        ts: msg.ts,
      });
    } catch (e) {
      console.log('Firestore save error', e);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.from === 'user' ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
        />
        {loading && <ActivityIndicator size="small" color="green" />}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Type your question..."
            value={input}
            onChangeText={setInput}
            style={styles.textInput}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={styles.sendButton}
          >
            <Text style={{ color: 'white' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f8f8f8' },
  messageBubble: { padding: 10, marginVertical: 5, borderRadius: 12, maxWidth: '80%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#d4f7dc' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  textInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 24 },
  sendButton: { marginLeft: 5, backgroundColor: 'green', padding: 12, borderRadius: 24 },
});