import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function RootLayout() {
    const [user, setUser] = useState<any | null>(null);
    const [initializing, setInitializing] = useState<boolean>(true);
    const auth = getAuth();

    useEffect(() => {
        const checkAuthState = async () => {
            // Check for Firebase authentication first.
            const firebaseUser = auth.currentUser;
            if (firebaseUser) {
                setUser(firebaseUser);
                setInitializing(false);
                return;
            }

            // If no Firebase user, check for offline mode.
            const isOffline = await AsyncStorage.getItem('isOfflineMode');
            if (isOffline === 'true') {
                setUser({ uid: 'offline_user' }); // Create a dummy user object
                setInitializing(false);
            } else {
                setUser(null);
                setInitializing(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
            setUser(firebaseUser);
            if (initializing) setInitializing(false);
        });

        // Run the initial check and keep the subscriber for real-time changes.
        checkAuthState();
        return () => unsubscribe();
    }, [auth]);

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <Stack>
            {user ? (
                // If user is logged in or in offline mode, show the main app tabs.
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            ) : (
                // Otherwise, show the login screen.
                <Stack.Screen name="loginscreen" options={{ headerShown: false }} />
            )}
        </Stack>
    );
}