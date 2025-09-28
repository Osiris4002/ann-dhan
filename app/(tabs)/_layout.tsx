import { router, Tabs } from 'expo-router';
import React from 'react';
import { Alert, Button } from 'react-native';
import { auth } from '../../firebaseConfig'; // Your Firebase auth

const _layout = () => {
  return (
  <Tabs
  screenOptions={{
    headerStyle: { backgroundColor: '#A8E6CF' }, // Light green
    headerTintColor: 'black', // Title text color
    headerTitleAlign: 'center',
    headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
    headerRight: () => (
      <Button
        title="Logout"
        color="black"
        onPress={() => {
          Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes",
                onPress: async () => {
                  try {
                    await auth.signOut();
                    router.replace('/loginscreen'); 
                  } catch (e) {
                    console.error("Logout error:", e);
                  }
                },
              },
            ]
          );
        }}
      />
    ),
  }}
>
  <Tabs.Screen
    name="index"
    options={{ title: 'Ann Dhan' }}
  />
  <Tabs.Screen
    name="chatbot"
    options={{ title: 'Chatbot' }}
  />
  {/* Add other tabs/screens here */}
</Tabs>
  )
}

export default _layout