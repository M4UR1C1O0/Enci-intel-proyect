import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "./services/firebase";

type Rol = "administrador" | "comercial" | "gerencia" | "pendiente";

type Usuario = {
  id: string;
  email: string;
  rol: Rol;
  estado: string;
};

function AdminUsuarios() {
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
      setMensaje("No se pudieron cargar los usuarios.");
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
        setMensaje("Debes iniciar sesión para cambiar roles.");
        return;
      }

      const esMiPropioUsuario = usuarioId === usuarioActual.uid;

      if (esMiPropioUsuario && nuevoRol !== "administrador") {
        setMensaje("No puedes quitarte tu propio rol de administrador.");
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

      setMensaje("Rol actualizado correctamente.");
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      setMensaje("No se pudo actualizar el rol.");
    }
  };

  if (loading) {
    return <p>Cargando usuarios...</p>;
  }

  return (
    <section className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <h1>Administración de Usuarios</h1>
          <p>Gestiona los roles y estados de acceso dentro de ENCI-INTEL.</p>
        </div>

        <span className="admin-users-badge">Solo Administrador</span>
      </div>

      {mensaje && <div className="admin-users-message">{mensaje}</div>}

      <div className="admin-users-card">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Correo</th>
              <th>Rol actual</th>
              <th>Estado</th>
              <th>Cambiar rol</th>
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
                      {usuario.rol}
                    </span>
                  </td>

                  <td>
                    <span className="status-pill">{usuario.estado}</span>
                  </td>

                  <td>
                    <select
                      value={usuario.rol}
                      onChange={(e) =>
                        cambiarRol(usuario.id, e.target.value as Rol)
                      }
                    >
                      <option value="administrador">Administrador</option>

                      {!esMiPropioUsuario && (
                        <>
                          <option value="gerencia">Gerencia</option>
                          <option value="comercial">Comercial</option>
                          <option value="pendiente">Pendiente</option>
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