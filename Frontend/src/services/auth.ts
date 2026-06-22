import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Variable en memoria — se limpia sola al recargar la página
export let currentSessionId: string | null = null;

export async function login(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const sessionId = crypto.randomUUID();
  try {
    await setDoc(doc(db, "users", result.user.uid), { activeSession: sessionId }, { merge: true });
    currentSessionId = sessionId;
  } catch {
    currentSessionId = null;
  }
  return result.user;
}

export async function logout() {
  currentSessionId = null;
  await signOut(auth);
  sessionStorage.clear();
  localStorage.removeItem("enci_role");
}
