import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getReactNativePersistence, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAjLwQB5TkGapgPczFpd4mpqoXJnL2v9SI",
  authDomain: "gogo-3b5d9.firebaseapp.com",
  projectId: "gogo-3b5d9",
  storageBucket: "gogo-3b5d9.firebasestorage.app",
  messagingSenderId: "368132898837",
  appId: "1:368132898837:web:2fca12da8dd13cde9dce1c",
  measurementId: "G-VRM35D4WDS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-aware persistence
const auth = initializeAuth(app, {
  persistence:
    Platform.OS === "web"
      ? browserLocalPersistence
      : getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
