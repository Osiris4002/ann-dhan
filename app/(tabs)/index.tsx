import { StyleSheet, Text, View } from 'react-native';
import ChatbotScreen from "../src/screens/chatbot";

export default function Index() {
  return (
     <View style={styles.container}>
      <Text style={styles.header}>Ann Dhan Chatbot</Text>
      <ChatbotScreen /> {/* 👈 Render the chatbot component here */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});
