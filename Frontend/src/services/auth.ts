import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function login(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem("enci_session_id", sessionId);
  setDoc(doc(db, "users", result.user.uid), { activeSession: sessionId }, { merge: true }).catch(() => {});
  return result.user;
}

export async function logout() {
  await signOut(auth);

  sessionStorage.clear();
  localStorage.removeItem("enci_role");
}