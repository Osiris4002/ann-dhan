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
            // Check for offline mode first
            const isOffline = await AsyncStorage.getItem('isOfflineMode');
            if (isOffline === 'true') {
                setUser({ uid: 'offline_user' });
                setInitializing(false);
                return;
            }

            // If not offline, check for Firebase authentication
            const subscriber = onAuthStateChanged(auth, firebaseUser => {
                setUser(firebaseUser);
                if (initializing) setInitializing(false);
            });
            return () => subscriber();
        };

        checkAuthState();
    }, []);

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
                // If user is logged in or in offline mode, show the main app tabs
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            ) : (
                // Otherwise, show the login screen
                <Stack.Screen name="loginscreen" options={{ headerShown: false }} />
            )}
        </Stack>
    );
}