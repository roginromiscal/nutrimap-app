import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
