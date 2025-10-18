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
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

function Lists() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [newItemText, setNewItemText] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "lists"),
      where("members", "array-contains", user.uid)
    );

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

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      await addDoc(collection(db, "lists"), {
        title: newListTitle,
        items: [],
        owner: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewListTitle("");
    } catch (error) {
      console.error("Error al crear lista:", error);
    }
  };

  const handleAddItem = async (listId) => {
    const text = newItemText[listId]?.trim();
    if (!text) return;

    try {
      const listRef = doc(db, "lists", listId);
      await updateDoc(listRef, {
        items: arrayUnion({
          id: Date.now().toString(),
          text,
          completed: false,
          createdAt: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp(),
      });
      setNewItemText({ ...newItemText, [listId]: "" });
    } catch (error) {
      console.error("Error al agregar item:", error);
    }
  };

  const handleToggleItem = async (listId, item) => {
    try {
      const listRef = doc(db, "lists", listId);

      await updateDoc(listRef, {
        items: arrayRemove(item),
      });
      await updateDoc(listRef, {
        items: arrayUnion({
          ...item,
          completed: !item.completed,
        }),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error al actualizar item:", error);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta lista?")) return;

    try {
      await deleteDoc(doc(db, "lists", listId));
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
            placeholder="Título de la lista..."
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
        <div className="grid md:grid-cols-2 gap-6">
          {lists.map((list) => (
            <div key={list.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {list.title}
                </h3>
                <button
                  onClick={() => handleDeleteList(list.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Eliminar lista"
                >
                  🗑️
                </button>
              </div>

              {/* Items de la lista */}
              <div className="space-y-2 mb-4">
                {list.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleItem(list.id, item)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span
                      className={`flex-1 ${
                        item.completed
                          ? "line-through text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Agregar nuevo item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemText[list.id] || ""}
                  onChange={(e) =>
                    setNewItemText({
                      ...newItemText,
                      [list.id]: e.target.value,
                    })
                  }
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddItem(list.id);
                    }
                  }}
                  placeholder="Nuevo item..."
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={() => handleAddItem(list.id)}
                  className="btn-primary text-sm"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Lists;
