import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Test users
const TEST_USERS = {
    '+919999999999': '999999',
    '+918888888888': '888888',
};

// Replace with your backend URL
const AUTH_API_URL = "https://ann-dhan-api.onrender.com/api/auth";

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [pin, setPin] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const auth = getAuth();
    const router = useRouter();

    // Listen for authentication state changes to automatically navigate
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                router.replace('/(tabs)');
            }
        });
        return unsubscribe;
    }, [auth, router]);

   
    const handleAuth = async () => {
    setLoading(true);
    try {
        // Corrected line to safely check for test users
        const isTestUser = (phoneNumber in TEST_USERS) && (TEST_USERS[phoneNumber as keyof typeof TEST_USERS] === pin);

        const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, pin, isTestUser }),
        });

        const data = await response.json();
        if (response.ok) {
            const customToken: string = data.token;
            await signInWithCustomToken(auth, customToken);
        } else {
            Alert.alert('Authentication Failed', data.message);
        }
    } 
    catch (error: unknown) {
    console.error(error); // Keep this to log the full error object for detailed debugging

    // Check if the error is a standard Error object to access its message
    if (error instanceof Error) {
        Alert.alert('Authentication Error', error.message);
    } else {
        // Fallback for unexpected errors that are not standard Error objects
        Alert.alert('Authentication Error', 'An unexpected error occurred.');
    }
} finally {
    setLoading(false);
}
    };

    const handleOfflineMode = async () => {
        try {
            await AsyncStorage.setItem('isOfflineMode', 'true');
            router.replace('/(tabs)');
        } catch (e) {
            console.error("Failed to set offline mode:", e);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ann Dhan Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Phone Number (+91...)"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
            />
            <TextInput
                style={styles.input}
                placeholder="6-digit PIN"
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                value={pin}
                onChangeText={setPin}
            />
            <Button
                title={loading ? 'Authenticating...' : 'Login'}
                onPress={handleAuth}
                disabled={loading}
            />
            <TouchableOpacity onPress={handleOfflineMode} style={styles.offlineButton}>
                <Text style={styles.offlineButtonText}>Proceed Offline</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    offlineButton: {
        marginTop: 20,
        padding: 10,
    },
    offlineButtonText: {
        color: 'gray',
        fontSize: 16,
    },
});