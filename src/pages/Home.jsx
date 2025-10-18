import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ¡Bienvenido a Secretaria! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Hola {user?.email?.split("@")[0]}, organiza tus listas y notas
          fácilmente
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Card de Listas */}
        <Link
          to="/listas"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
            📋
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Listas</h2>
          <p className="text-gray-600 mb-4">
            Crea listas de tareas, compras o lo que necesites. Compártelas con
            tus amigos y colaboren juntos.
          </p>
          <div className="text-primary-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
            Ver mis listas →
          </div>
        </Link>

        {/* Card de Notas */}
        <Link
          to="/notas"
          className="card hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
            📝
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Notas</h2>
          <p className="text-gray-600 mb-4">
            Escribe notas rápidas, ideas o recordatorios. Compártelas y mantén
            todo sincronizado.
          </p>
          <div className="text-primary-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
            Ver mis notas →
          </div>
        </Link>
      </div>

      {/* Características */}
      <div className="card max-w-4xl mx-auto mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Características principales
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">
              Sincronización en tiempo real con Firebase
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">
              Comparte listas y notas con amigos
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">
              Acceso desde cualquier dispositivo
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">
              Interfaz simple y fácil de usar
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
