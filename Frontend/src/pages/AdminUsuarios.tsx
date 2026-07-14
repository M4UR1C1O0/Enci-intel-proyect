import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

type Rol = "administrador" | "comercial" | "gerencia" | "pendiente";

type Usuario = {
  id: string;
  email: string;
  rol: Rol;
  estado: string;
};

function AdminUsuarios() {
  const { t } = useTranslation();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const cargarUsuarios = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));

      const data = querySnapshot.docs.map((documento) => ({
        id: documento.id,
        email: documento.data().email || "",
        rol: documento.data().rol || "pendiente",
        estado: documento.data().estado || "activo",
      })) as Usuario[];

      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setMensaje(t("adminUsers.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      await cargarUsuarios();
    };

    cargar();
  }, []);

  const cambiarRol = async (usuarioId: string, nuevoRol: Rol) => {
    try {
      const usuarioActual = auth.currentUser;

      if (!usuarioActual) {
        setMensaje(t("adminUsers.mustLogin"));
        return;
      }

      const esMiPropioUsuario = usuarioId === usuarioActual.uid;

      if (esMiPropioUsuario && nuevoRol !== "administrador") {
        setMensaje(t("adminUsers.cantRemoveOwnAdmin"));
        return;
      }

      if (!esMiPropioUsuario && nuevoRol === "administrador") {
        setMensaje(t("adminUsers.cantGrantAdmin"));
        return;
      }

      const usuarioRef = doc(db, "users", usuarioId);

      await updateDoc(usuarioRef, {
        rol: nuevoRol,
      });

      setUsuarios((usuariosActuales) =>
        usuariosActuales.map((usuario) =>
          usuario.id === usuarioId ? { ...usuario, rol: nuevoRol } : usuario
        )
      );

      setMensaje(t("adminUsers.roleUpdated"));
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      setMensaje(t("adminUsers.roleUpdateError"));
    }
  };

  if (loading) {
    return <p>{t("adminUsers.loading")}</p>;
  }

  return (
    <section className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>{t("adminUsers.title")}</h1>
          <p>{t("adminUsers.subtitle")}</p>
        </div>

        <span className="admin-users-badge">{t("adminUsers.adminOnlyBadge")}</span>
      </div>

      {mensaje && <div className="admin-users-message">{mensaje}</div>}

      <div className="admin-users-card">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>{t("adminUsers.colEmail")}</th>
              <th>{t("adminUsers.colCurrentRole")}</th>
              <th>{t("adminUsers.colStatus")}</th>
              <th>{t("adminUsers.colChangeRole")}</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => {
              const esMiPropioUsuario = usuario.id === auth.currentUser?.uid;

              return (
                <tr key={usuario.id}>
                  <td>{usuario.email}</td>

                  <td>
                    <span className={`role-pill role-${usuario.rol}`}>
                      {t(`roles.${usuario.rol}`)}
                    </span>
                  </td>

                  <td>
                    <span className="status-pill">
                      {t(`adminUsers.statusLabel.${usuario.estado}`, usuario.estado)}
                    </span>
                  </td>

                  <td>
                    <select
                      value={usuario.rol}
                      onChange={(e) =>
                        cambiarRol(usuario.id, e.target.value as Rol)
                      }
                    >
                      {esMiPropioUsuario ? (
                        <option value="administrador">{t("roles.administrador")}</option>
                      ) : (
                        <>
                          <option value="gerencia">{t("roles.gerencia")}</option>
                          <option value="comercial">{t("roles.comercial")}</option>
                          <option value="pendiente">{t("roles.pendiente")}</option>
                        </>
                      )}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminUsuarios;