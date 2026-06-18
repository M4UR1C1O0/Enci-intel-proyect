import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getUserRole(uid: string) {
  console.log("UID que está usando la app:", uid);

  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    console.log("No existe documento en Firestore para este UID:", uid);
    return "pendiente";
  }

  const data = snap.data();
  console.log("Datos encontrados en Firestore:", data);

  const obtenerCampo = (nombreBuscado: string) => {
    const entrada = Object.entries(data).find(
      ([clave]) => clave.trim().toLowerCase() === nombreBuscado
    );

    return entrada ? String(entrada[1]).trim().toLowerCase() : "";
  };

  const estado = obtenerCampo("estado");
  const rol = obtenerCampo("rol");

  console.log("Estado normalizado:", estado);
  console.log("Rol normalizado:", rol);

  if (estado !== "activo") {
    console.log("El estado no es activo, por eso queda pendiente.");
    return "pendiente";
  }

  return rol || "pendiente";
}