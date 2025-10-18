import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notes"),
      where("members", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      notesData.sort((a, b) => {
        const dateA = a.updatedAt?.toDate() || new Date(0);
        const dateB = b.updatedAt?.toDate() || new Date(0);
        return dateB - dateA;
      });
      setNotes(notesData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;

    try {
      await addDoc(collection(db, "notes"), {
        title: newNote.title,
        content: newNote.content,
        owner: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewNote({ title: "", content: "" });
    } catch (error) {
      console.error("Error al crear nota:", error);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.title.trim()) return;

    try {
      const noteRef = doc(db, "notes", editingNote.id);
      await updateDoc(noteRef, {
        title: editingNote.title,
        content: editingNote.content,
        updatedAt: serverTimestamp(),
      });
      setEditingNote(null);
    } catch (error) {
      console.error("Error al actualizar nota:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta nota?")) return;

    try {
      await deleteDoc(doc(db, "notes", noteId));
    } catch (error) {
      console.error("Error al eliminar nota:", error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📝 Mis Notas</h1>
      </div>

      {/* Formulario para crear nota */}
      <form onSubmit={handleCreateNote} className="card">
        <h2 className="text-xl font-semibold mb-4">Crear nueva nota</h2>
        <div className="space-y-3">
          <input
            type="text"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            placeholder="Título de la nota..."
            className="input"
          />
          <textarea
            value={newNote.content}
            onChange={(e) =>
              setNewNote({ ...newNote, content: e.target.value })
            }
            placeholder="Contenido de la nota..."
            rows="4"
            className="input resize-none"
          />
          <button type="submit" className="btn-primary">
            Crear Nota
          </button>
        </div>
      </form>

      {/* Lista de notas */}
      {notes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">
            No tienes notas aún. ¡Crea tu primera nota arriba!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="card hover:shadow-lg transition-shadow"
            >
              {editingNote?.id === note.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, title: e.target.value })
                    }
                    className="input"
                  />
                  <textarea
                    value={editingNote.content}
                    onChange={(e) =>
                      setEditingNote({
                        ...editingNote,
                        content: e.target.value,
                      })
                    }
                    rows="6"
                    className="input resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateNote}
                      className="btn-primary text-sm flex-1"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingNote(null)}
                      className="btn-secondary text-sm flex-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {note.title}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap mb-3 line-clamp-6">
                    {note.content || "(Sin contenido)"}
                  </p>

                  <p className="text-xs text-gray-400">
                    {formatDate(note.updatedAt)}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notes;
