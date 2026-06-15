import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getUserRole(email: string) {
  const ref = doc(db, "users", email);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return "Pendiente";
  }

  return snap.data().role || "Pendiente";
}