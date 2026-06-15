import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyCfaj5DOvw9LAaD5WKDsAuZUYwr4duOJ6c",
  authDomain: "enci-intel-b48da.firebaseapp.com",
  projectId: "enci-intel-b48da",
  storageBucket: "enci-intel-b48da.firebasestorage.app",
  messagingSenderId: "510562258101",
  appId: "1:510562258101:web:ef62562dab3960278a02fc",
  measurementId: "G-TMSKENGD65",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);