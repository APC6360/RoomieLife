import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCBw_hMAwgat_mOyhzK2ZigQS4nn0VO8KI",
    authDomain: "roomielife-18adb.firebaseapp.com",
    projectId: "roomielife-18adb",
    storageBucket: "roomielife-18adb.firebasestorage.app",
    messagingSenderId: "1076561208623",
    appId: "1:1076561208623:web:5482b640ca54f475d7adda"
  };

// // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 export const auth = getAuth(app);
 export const storage = getStorage(app);
 export const database = getFirestore(app);
 export const analytics = () => getAnalytics(app);

