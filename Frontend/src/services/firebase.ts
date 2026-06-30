import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0AC-dCnG3hdzAnfFdj5zLfO1136c-wek",
  authDomain: "enci-intel.firebaseapp.com",
  projectId: "enci-intel",
  storageBucket: "enci-intel.firebasestorage.app",
  messagingSenderId: "557520605916",
  appId: "1:557520605916:web:d9f15ed4d873aa33549a19",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export const db = getFirestore(app);