import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getUserRole(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return "pendiente";
  }

  const data = snap.data();

  const obtenerCampo = (nombreBuscado: string) => {
    const entrada = Object.entries(data).find(
      ([clave]) => clave.trim().toLowerCase() === nombreBuscado
    );

    return entrada ? String(entrada[1]).trim().toLowerCase() : "";
  };

  const estado = obtenerCampo("estado");
  const rol = obtenerCampo("rol");

  if (estado !== "activo") {
    return "pendiente";
  }

  return rol || "pendiente";
}