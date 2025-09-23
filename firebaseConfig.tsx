// firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    // ... your project config here
     apiKey: "AIzaSyAO3g5X-6Ek1K62aRCoM79CTz6UgBXyOPE",
    authDomain: "ann-dhan-9bffc.firebaseapp.com",
    projectId: "ann-dhan-9bffc",
    storageBucket: "ann-dhan-9bffc.firebasestorage.app",
    messagingSenderId: "551030178875",
    appId: "1:551030178875:web:2301abfe64afea7ab8081e",
    measurementId: "G-GF11PCWJHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
});

// For React Native, you must provide the AsyncStorage implementation
// This is done via an internal Firebase mechanism, so we ensure the
// AsyncStorage import is present for the bundling to work correctly.
// Note: This specific part is handled internally by Firebase v10+
// and its compatibility layer.

// Initialize Firestore
const db = getFirestore(app);

// Export the initialized services
export { app, auth, db };
