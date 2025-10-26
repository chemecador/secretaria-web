import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

function Dashboard() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCompleted, setEditCompleted] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = collection(db, "users", user.uid, "noteslist");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLists(listsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || !selectedList) {
      setNotes([]);
      return;
    }

    setLoadingNotes(true);
    const notesRef = collection(
      db,
      "users",
      user.uid,
      "noteslist",
      selectedList.id,
      "notes"
    );

    const unsubscribe = onSnapshot(notesRef, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(notesData);
      setLoadingNotes(false);
    });

    return unsubscribe;
  }, [user, selectedList]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      await addDoc(collection(db, "users", user.uid, "noteslist"), {
        name: newListTitle,
        notes: [],
        creator: user.email,
        contributors: [user.uid],
        type: "",
        date: serverTimestamp(),
      });
      setNewListTitle("");
    } catch (error) {
      console.error("Error al crear lista:", error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedList) return;

    const newNote = {
      title: newNoteText,
      content: newNoteContent,
      completed: false,
      color: -1,
      order: 0,
      creator: user.email,
      date: serverTimestamp(),
    };

    try {
      const notesRef = collection(
        db,
        "users",
        user.uid,
        "noteslist",
        selectedList.id,
        "notes"
      );
      await addDoc(notesRef, newNote);
      setNewNoteText("");
      setNewNoteContent("");
      setShowNoteForm(false);
    } catch (error) {
      console.error("Error al agregar nota:", error);
    }
  };

  const handleToggleNote = async (note) => {
    if (!selectedList) return;

    try {
      const noteRef = doc(
        db,
        "users",
        user.uid,
        "noteslist",
        selectedList.id,
        "notes",
        note.id
      );
      await updateDoc(noteRef, {
        completed: !note.completed,
      });
    } catch (error) {
      console.error("Error al actualizar nota:", error);
    }
  };

  const handleDeleteNote = async (note) => {
    if (!selectedList) return;
    if (!window.confirm("¿Estás seguro de eliminar esta nota?")) return;

    try {
      const noteRef = doc(
        db,
        "users",
        user.uid,
        "noteslist",
        selectedList.id,
        "notes",
        note.id
      );
      await deleteDoc(noteRef);
    } catch (error) {
      console.error("Error al eliminar nota:", error);
    }
  };

  const handleStartEdit = (note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || "");
    setEditCompleted(note.completed || false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingNote || !selectedList) return;

    try {
      const noteRef = doc(
        db,
        "users",
        user.uid,
        "noteslist",
        selectedList.id,
        "notes",
        editingNote.id
      );
      await updateDoc(noteRef, {
        title: editTitle,
        content: editContent,
        completed: editCompleted,
      });
      setEditingNote(null);
      setEditTitle("");
      setEditContent("");
      setEditCompleted(false);
    } catch (error) {
      console.error("Error al actualizar nota:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditTitle("");
    setEditContent("");
    setEditCompleted(false);
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta lista?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "noteslist", listId));
    } catch (error) {
      console.error("Error al eliminar lista:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (selectedList) {
    const sortedNotes = [...notes].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return 0;
    });

    return (
      <div className="space-y-6">
        {/* Header con botón de volver */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedList(null)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <span className="text-2xl">←</span>
            <span>Volver</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex-1">
            � {selectedList.name}
          </h1>
          <button
            onClick={() => {
              handleDeleteList(selectedList.id);
              setSelectedList(null);
            }}
            className="text-red-500 hover:text-red-700 px-4 py-2 rounded"
            title="Eliminar lista"
          >
            🗑️ Eliminar lista
          </button>
        </div>

        {/* Botón o Formulario para agregar nota */}
        {!showNoteForm ? (
          <button
            onClick={() => setShowNoteForm(true)}
            className="btn-primary w-full py-3"
          >
            ➕ Agregar nueva nota
          </button>
        ) : (
          <form onSubmit={handleAddNote} className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">✍️ Agregar nueva nota</h2>
              <button
                type="button"
                onClick={() => {
                  setShowNoteForm(false);
                  setNewNoteText("");
                  setNewNoteContent("");
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Cancelar"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Escribe el título de la nota..."
                  className="input w-full"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido (opcional)
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Escribe el contenido de la nota..."
                  rows="4"
                  className="input resize-none w-full"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={!newNoteText.trim()}
                >
                  ➕ Agregar Nota
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteForm(false);
                    setNewNoteText("");
                    setNewNoteContent("");
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Lista de notas */}
        {loadingNotes ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">
              No hay notas en esta lista. ¡Agrega tu primera nota arriba!
            </p>
          </div>
        ) : (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              Notas ({sortedNotes.filter((n) => !n.completed).length}{" "}
              pendientes)
            </h3>
            <div className="space-y-2">
              {sortedNotes.map((note) => (
                <div key={note.id}>
                  {editingNote?.id === note.id ? (
                    // Formulario de edición
                    <div className="p-4 rounded border-2 border-primary-500 bg-primary-50">
                      <form onSubmit={handleSaveEdit}>
                        <div className="space-y-3">
                          {/* Checkbox de completado */}
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-300">
                            <input
                              type="checkbox"
                              checked={editCompleted}
                              onChange={(e) => setEditCompleted(e.target.checked)}
                              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                              id={`completed-${note.id}`}
                            />
                            <label
                              htmlFor={`completed-${note.id}`}
                              className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                              Marcar como completada
                            </label>
                          </div>

                          {/* Campo de título */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Título
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="input w-full"
                              autoFocus
                              required
                            />
                          </div>

                          {/* Campo de contenido */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Contenido (opcional)
                            </label>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows="3"
                              className="input resize-none w-full"
                            />
                          </div>

                          {/* Botones de acción */}
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="btn-primary flex-1"
                              disabled={!editTitle.trim()}
                            >
                              💾 Guardar
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="btn-secondary flex-1"
                            >
                              Cancelar
                            </button>
                          </div>

                          {/* Botón de eliminar */}
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteNote(note);
                              setEditingNote(null);
                            }}
                            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded border border-red-300 text-sm font-medium transition-colors"
                          >
                            🗑️ Eliminar nota
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    // Vista normal de la nota - solo lectura
                    <div
                      className="flex items-start gap-3 p-3 rounded hover:bg-gray-50 border border-gray-200 cursor-pointer transition-colors"
                      onClick={() => handleStartEdit(note)}
                    >
                      {/* Indicador visual de completado */}
                      <div className="w-5 h-5 mt-1 flex-shrink-0">
                        {note.completed ? (
                          <span className="text-green-500 text-xl">✓</span>
                        ) : (
                          <span className="text-gray-300 text-xl">○</span>
                        )}
                      </div>

                      {/* Contenido de la nota */}
                      <div className="flex-1">
                        <div
                          className={`font-medium ${
                            note.completed
                              ? "line-through text-gray-400"
                              : "text-gray-700"
                          }`}
                        >
                          {note.title}
                        </div>
                        {note.content && (
                          <div
                            className={`text-sm mt-1 ${
                              note.completed ? "text-gray-300" : "text-gray-500"
                            }`}
                          >
                            {note.content}
                          </div>
                        )}
                      </div>

                      {/* Indicador de click */}
                      <div className="text-gray-400 text-sm mt-1">✏️</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📋 Mis Listas</h1>
      </div>

      {/* Formulario para crear lista */}
      <form onSubmit={handleCreateList} className="card">
        <h2 className="text-xl font-semibold mb-4">Crear nueva lista</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="Nombre de la lista..."
            className="input flex-1"
          />
          <button type="submit" className="btn-primary">
            Crear
          </button>
        </div>
      </form>

      {/* Lista de listas */}
      {lists.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">
            No tienes listas aún. ¡Crea tu primera lista arriba!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => {
            return (
              <div
                key={list.id}
                onClick={() => setSelectedList(list)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {list.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id);
                    }}
                    className="text-red-400 hover:text-red-600 text-sm"
                    title="Eliminar lista"
                  >
                    🗑️
                  </button>
                </div>

                {/* Tipo de lista si existe */}
                {list.type && (
                  <div className="text-sm text-gray-500">{list.type}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
