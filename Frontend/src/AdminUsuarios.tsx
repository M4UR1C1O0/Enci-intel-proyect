import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "./services/firebase";

type Rol = "Admin" | "Comercial" | "Gerencia" | "Pendiente";

type Usuario = {
  id: string;
  email: string;
  role: Rol;
  status: string;
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
        role: documento.data().role || "Pendiente",
        status: documento.data().status || "Activo",
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

  const cambiarRol = async (usuarioId: string, email: string, nuevoRol: Rol) => {
    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        setMensaje("No hay una sesión activa.");
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/admin/users/role",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            role: nuevoRol,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo actualizar el rol desde el backend");
      }

      setUsuarios((usuariosActuales) =>
        usuariosActuales.map((usuario) =>
          usuario.id === usuarioId ? { ...usuario, role: nuevoRol } : usuario
        )
      );

      setMensaje("Rol actualizado correctamente desde el backend.");
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

        <span className="admin-users-badge">Solo Admin</span>
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
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.email}</td>

                <td>
                  <span
                    className={`role-pill role-${usuario.role.toLowerCase()}`}
                  >
                    {usuario.role}
                  </span>
                </td>

                <td>
                  <span className="status-pill">{usuario.status}</span>
                </td>

                <td>
                  <select
                    value={usuario.role}
                    onChange={(e) =>
                      cambiarRol(
                        usuario.id,
                        usuario.email,
                        e.target.value as Rol
                      )
                    }
                  >
                    <option value="Admin">Admin</option>
                    <option value="Gerencia">Gerencia</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminUsuarios;