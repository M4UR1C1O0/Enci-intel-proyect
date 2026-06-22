import { useEffect, useRef, useState } from "react";
import { getAdminDocuments, uploadDocument, deleteDocument } from "../services/api";

type DocEntry = {
  filename: string;
  size_kb: number;
  chunks: number;
  indexed: boolean;
};

type Props = {
  language?: "es" | "en";
};

const t = {
  es: {
    title: "Documentos IA",
    subtitle: "Sube PDFs o TXT para ampliar la base de conocimiento del consultor veterinario.",
    upload: "Subir documento",
    uploading: "Subiendo...",
    dropzone: "Arrastra un PDF o TXT aquí, o haz clic para seleccionar",
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

  useEffect(() => { load(); }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const res = await uploadDocument(file);
        const d = res.data;
        let msg = `${d.filename}: ${d.new_chunks} chunks indexados.`;
        if (!d.is_veterinary) msg += ` ${tx.nonVet}`;
        showFlash(msg, d.is_veterinary ? "ok" : "error");
      } catch (e: any) {
        const detail = e?.response?.data?.detail ?? "Error al subir archivo.";
        showFlash(`${file.name}: ${detail}`, "error");
      }
    }
    setUploading(false);
    await load();
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(tx.confirmDelete)) return;
    try {
      await deleteDocument(filename);
      showFlash(`${filename} eliminado.`, "ok");
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
        <button
          className="admin-docs-upload-btn"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? tx.uploading : tx.upload}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {flash && (
        <div className={`admin-docs-flash ${flash.type}`}>{flash.msg}</div>
      )}

      <div
        className="admin-docs-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        {tx.dropzone}
      </div>

      {loading ? (
        <p className="admin-docs-loading">{tx.loading}</p>
      ) : docs.length === 0 ? (
        <p className="admin-docs-empty">{tx.empty}</p>
      ) : (
        <table className="admin-docs-table">
          <thead>
            <tr>
              <th>{tx.colFile}</th>
              <th>{tx.colSize}</th>
              <th>{tx.colChunks}</th>
              <th>{tx.colStatus}</th>
              <th>{tx.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.filename}>
                <td className="admin-docs-filename">{doc.filename}</td>
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
