import { useEffect, useRef, useState, startTransition } from "react";
import { getAdminDocuments, uploadDocument, deleteDocument } from "../services/api";

type DocEntry = {
  filename: string;
  title: string;
  category: string;
  size_kb: number;
  chunks: number;
  indexed: boolean;
};

type Props = {
  language?: "es" | "en";
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
  },
};

export default function AdminDocumentos({ language = "es" }: Props) {
  const tx = t[language];
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState<{ msg: string; type: "ok" | "error" } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("DOC");
  const inputRef = useRef<HTMLInputElement>(null);

  const showFlash = (msg: string, type: "ok" | "error") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 5000);
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
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      showFlash(`${tx.uploading} (${i + 1}/${list.length}): ${file.name}`, "ok");
      try {
        const res = await uploadDocument(file, "", "");
        const d = res.data;
        if (!d.is_veterinary) showFlash(`${file.name}: ${tx.nonVet}`, "error");
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } } };
        const detail = err?.response?.data?.detail ?? "Error al subir archivo.";
        showFlash(`${file.name}: ${detail}`, "error");
      }
    }
    setUploading(false);
    await load();
  };

  const handleSubmit = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const res = await uploadDocument(pendingFile, docTitle.trim() || pendingFile.name, docCategory);
      const d = res.data;
      let msg = `${docTitle || d.filename}: ${d.new_chunks} chunks indexados.`;
      if (!d.is_veterinary) msg += ` ${tx.nonVet}`;
      showFlash(msg, d.is_veterinary ? "ok" : "error");
      setPendingFile(null);
      setDocTitle("");
      setDocCategory("DOC");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const detail = err?.response?.data?.detail ?? "Error al subir archivo.";
      showFlash(`${pendingFile.name}: ${detail}`, "error");
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
        <div className={`admin-docs-flash ${flash.type}`}>{flash.msg}</div>
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