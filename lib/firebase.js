import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBeRDNhkevyN0oFIGzs2B9M_pVG05HK9rM",
  authDomain: "nutrimap-a9b5a.firebaseapp.com",
  projectId: "nutrimap-a9b5a",
  storageBucket: "nutrimap-a9b5a.appspot.com",
  messagingSenderId: "187000738544",
  appId: "1:187000738544:web:97999ae69cc8179c882835"
  // measurementId is OPTIONAL — safe to remove
};

// Initialize Firebase (or get existing instance)
let app;
try {
  app = getApp();
} catch (error) {
  app = initializeApp(firebaseConfig);
}

// Initialize Auth with AsyncStorage persistence.
// initializeAuth must run first — getAuth() alone silently defaults to
// memory-only persistence instead of throwing, so it can't be used to detect
// "not yet initialized". On Fast Refresh re-execution, initializeAuth throws
// because auth is already set up, and we fall back to getAuth to reuse it.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}

// Export services
const db = getFirestore(app);

export { auth, db };
