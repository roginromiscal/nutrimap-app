import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeRDNhkevyN0oFIGzs2B9M_pVG05HK9rM",
  authDomain: "nutrimap-a9b5a.firebaseapp.com",
  projectId: "nutrimap-a9b5a",
  storageBucket: "nutrimap-a9b5a.appspot.com",
  messagingSenderId: "187000738544",
  appId: "1:187000738544:web:97999ae69cc8179c882835"
};

let app;
try {
  app = getApp();
} catch (error) {
  app = initializeApp(firebaseConfig);
}

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };
