import { useEffect, useRef, useState, startTransition } from "react";
import { getAdminDocuments, uploadDocument, deleteDocument } from "../services/api";

type DocEntry = {
  filename: string;
  title: string;
  category: string;
  size_kb: number;
  chunks: number;
  indexed: boolean;
  is_veterinary: boolean;
};

type Props = {
  language?: "es" | "en";
};

type UploadItem = {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  message?: string;
};

const CATEGORIES = [
  { value: "DOC", label: { es: "Documento",       en: "Document"       } },
  { value: "PR",  label: { es: "Paper científico", en: "Research paper"  } },
  { value: "REG", label: { es: "Regulación",       en: "Regulation"     } },
  { value: "MAN", label: { es: "Manual técnico",   en: "Technical manual"} },
  { value: "INF", label: { es: "Informe",           en: "Report"         } },
];

const CATEGORY_COLORS: Record<string, string> = {
  DOC: "#64748b", PR: "#2563eb", REG: "#d97706", MAN: "#059669", INF: "#7c3aed",
};

const t = {
  es: {
    title: "Documentos IA",
    subtitle: "Sube PDFs o TXT para ampliar la base de conocimiento del consultor veterinario.",
    upload: "Subir documento",
    uploading: "Subiendo...",
    dropzone: "Arrastra un PDF o TXT aquí, o haz clic para seleccionar",
    fieldTitle: "Nombre del documento",
    fieldTitlePlaceholder: "Ej. Manual buenas prácticas mascotas",
    fieldCategory: "Categoría",
    colTitle: "Nombre",
    colFile: "Archivo",
    colSize: "Tamaño",
    colChunks: "Chunks",
    colStatus: "Estado",
    colActions: "Acciones",
    indexed: "Indexado",
    pending: "Sin indexar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar este documento del índice?",
    empty: "No hay documentos cargados.",
    loading: "Cargando...",
    nonVet: "Advertencia: el contenido no parece ser de naturaleza veterinaria.",
    nonVetMultiple: "Los siguientes archivos no parecen ser de naturaleza veterinaria:",
    nonVetBadge: "No veterinario",
    uploadProgress: "Subiendo archivos",
  },
  en: {
    title: "AI Documents",
    subtitle: "Upload PDFs or TXT files to expand the veterinary consultant knowledge base.",
    upload: "Upload document",
    uploading: "Uploading...",
    dropzone: "Drag a PDF or TXT here, or click to select",
    fieldTitle: "Document name",
    fieldTitlePlaceholder: "E.g. Pet best practices manual",
    fieldCategory: "Category",
    colTitle: "Name",
    colFile: "File",
    colSize: "Size",
    colChunks: "Chunks",
    colStatus: "Status",
    colActions: "Actions",
    indexed: "Indexed",
    pending: "Not indexed",
    delete: "Delete",
    confirmDelete: "Delete this document from the index?",
    empty: "No documents loaded.",
    loading: "Loading...",
    nonVet: "Warning: content does not appear to be veterinary in nature.",
    nonVetMultiple: "The following files do not appear to be veterinary in nature:",
    nonVetBadge: "Non-veterinary",
    uploadProgress: "Uploading files",
  },
};

export default function AdminDocumentos({ language = "es" }: Props) {
  const tx = t[language];
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [flash, setFlash] = useState<{ msg: string; type: "ok" | "error"; persist?: boolean } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("DOC");
  const inputRef = useRef<HTMLInputElement>(null);

  const showFlash = (msg: string, type: "ok" | "error", persist = false) => {
    setFlash({ msg, type, persist });
    if (!persist) setTimeout(() => setFlash(null), 5000);
  };

  const updateUploadItem = (name: string, patch: Partial<UploadItem>) => {
    setUploadQueue((q) => q.map((item) => (item.name === name ? { ...item, ...patch } : item)));
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminDocuments();
      setDocs(res.data ?? []);
    } catch {
      showFlash("Error al cargar documentos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { startTransition(() => { load(); }); }, []);

  useEffect(() => {
    if (!uploading && uploadQueue.length > 0) {
      const timer = setTimeout(() => setUploadQueue([]), 6000);
      return () => clearTimeout(timer);
    }
  }, [uploading, uploadQueue.length]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    if (list.length === 1) {
      const file = list[0];
      setPendingFile(file);
      setDocTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").trim());
      setDocCategory("DOC");
      return;
    }
    // Bulk: sube todos directamente, la IA genera metadatos
    setUploading(true);
    setUploadQueue(list.map((f) => ({ name: f.name, status: "pending" })));
    const nonVetFiles: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      updateUploadItem(file.name, { status: "uploading" });
      try {
        const res = await uploadDocument(file, "", "");
        const d = res.data;
        if (!d.is_veterinary) nonVetFiles.push(file.name);
        updateUploadItem(file.name, { status: "done" });
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } } };
        const detail = err?.response?.data?.detail ?? "Error al subir archivo.";
        updateUploadItem(file.name, { status: "error", message: detail });
      }
    }
    setUploading(false);
    if (nonVetFiles.length > 0) {
      showFlash(`${tx.nonVetMultiple} ${nonVetFiles.join(", ")}`, "error", true);
    }
    await load();
  };

  const handleSubmit = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setUploadQueue([{ name: pendingFile.name, status: "uploading" }]);
    try {
      const res = await uploadDocument(pendingFile, docTitle.trim() || pendingFile.name, docCategory);
      const d = res.data;
      let msg = `${docTitle || d.filename}: ${d.new_chunks} chunks indexados.`;
      if (!d.is_veterinary) msg += ` ${tx.nonVet}`;
      showFlash(msg, d.is_veterinary ? "ok" : "error", !d.is_veterinary);
      updateUploadItem(pendingFile.name, { status: "done" });
      setPendingFile(null);
      setDocTitle("");
      setDocCategory("DOC");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const detail = err?.response?.data?.detail ?? "Error al subir archivo.";
      showFlash(`${pendingFile.name}: ${detail}`, "error");
      updateUploadItem(pendingFile.name, { status: "error", message: detail });
    }
    setUploading(false);
    await load();
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(tx.confirmDelete)) return;
    try {
      await deleteDocument(filename);
      showFlash(`Documento eliminado.`, "ok");
      await load();
    } catch {
      showFlash("Error al eliminar documento.", "error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="admin-docs">
      <div className="admin-docs-header">
        <div>
          <h2>{tx.title}</h2>
          <p>{tx.subtitle}</p>
        </div>
      </div>

      {flash && (
        <div className={`admin-docs-flash ${flash.type}`}>
          <span>{flash.msg}</span>
          {flash.persist && (
            <button
              className="admin-docs-flash-close"
              onClick={() => setFlash(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Zona de subida */}
      <div
        className="admin-docs-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !pendingFile && inputRef.current?.click()}
      >
        {pendingFile ? (
          <span>📄 {pendingFile.name}</span>
        ) : (
          tx.dropzone
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Formulario de metadatos */}
      {pendingFile && (
        <div className="admin-docs-meta-form">
          <div className="admin-docs-meta-field">
            <label>{tx.fieldTitle}</label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder={tx.fieldTitlePlaceholder}
            />
          </div>
          <div className="admin-docs-meta-field">
            <label>{tx.fieldCategory}</label>
            <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  [{c.value}] {c.label[language]}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-docs-meta-actions">
            <button
              className="admin-docs-upload-btn"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? tx.uploading : tx.upload}
            </button>
            <button
              className="admin-docs-cancel-btn"
              onClick={() => { setPendingFile(null); setDocTitle(""); }}
              disabled={uploading}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Progreso de subida */}
      {uploadQueue.length > 0 && (() => {
        const done = uploadQueue.filter((u) => u.status === "done" || u.status === "error").length;
        const pct = Math.round((done / uploadQueue.length) * 100);
        return (
          <div className="admin-docs-upload-progress">
            <div className="admin-docs-upload-progress-label">
              {tx.uploadProgress} ({done}/{uploadQueue.length})
            </div>
            <div className="admin-docs-upload-progress-bar">
              <div className="admin-docs-upload-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <ul className="admin-docs-upload-list">
              {uploadQueue.map((item) => (
                <li key={item.name} className={`admin-docs-upload-item ${item.status}`}>
                  <span className="admin-docs-upload-icon">
                    {item.status === "pending" && "⏳"}
                    {item.status === "uploading" && "⬆️"}
                    {item.status === "done" && "✅"}
                    {item.status === "error" && "❌"}
                  </span>
                  <span className="admin-docs-upload-name">{item.name}</span>
                  {item.status === "error" && item.message && (
                    <span className="admin-docs-upload-error-msg">{item.message}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {loading ? (
        <p className="admin-docs-loading">{tx.loading}</p>
      ) : docs.length === 0 ? (
        <p className="admin-docs-empty">{tx.empty}</p>
      ) : (
        <table className="admin-docs-table">
          <thead>
            <tr>
              <th>{tx.colTitle}</th>
              <th>{tx.colSize}</th>
              <th>{tx.colChunks}</th>
              <th>{tx.colStatus}</th>
              <th>{tx.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.filename}>
                <td>
                  <div className="admin-docs-title-cell">
                    <span
                      className="admin-docs-category-badge"
                      style={{ background: CATEGORY_COLORS[doc.category] ?? "#64748b" }}
                    >
                      {doc.category}
                    </span>
                    <span className="admin-docs-title">{doc.title || doc.filename}</span>
                    {!doc.is_veterinary && (
                      <span className="admin-docs-nonvet-badge" title={tx.nonVet}>
                        ⚠️
                      </span>
                    )}
                  </div>
                </td>
                <td>{doc.size_kb} KB</td>
                <td>{doc.chunks}</td>
                <td>
                  <span className={`admin-docs-badge ${doc.indexed ? "ok" : "pending"}`}>
                    {doc.indexed ? tx.indexed : tx.pending}
                  </span>
                </td>
                <td>
                  <button
                    className="admin-docs-delete"
                    onClick={() => handleDelete(doc.filename)}
                  >
                    {tx.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}