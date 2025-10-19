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

function Lists() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);

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
      content: "",
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

        {/* Formulario para agregar nota */}
        <form onSubmit={handleAddNote} className="card">
          <h2 className="text-xl font-semibold mb-4">Agregar nueva nota</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Escribe tu nota..."
              className="input flex-1"
              autoFocus
            />
            <button type="submit" className="btn-primary">
              Agregar
            </button>
          </div>
        </form>

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
                <div
                  key={note.id}
                  className="flex items-center gap-3 p-3 rounded hover:bg-gray-50 border border-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={note.completed}
                    onChange={() => handleToggleNote(note)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span
                    className={`flex-1 ${
                      note.completed
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    }`}
                  >
                    {note.title}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note)}
                    className="text-red-400 hover:text-red-600 text-sm px-2"
                    title="Eliminar nota"
                  >
                    🗑️
                  </button>
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

export default Lists;
