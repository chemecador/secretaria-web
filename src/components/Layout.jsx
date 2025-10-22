import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y navegación */}
            <div className="flex items-center space-x-8">
              <Link
                to="/listas"
                className="text-2xl font-bold text-primary-600"
              >
                📝 Secretaria
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link
                  to="/listas"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/listas")
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  📋 Listas
                </Link>
              </nav>
            </div>

            {/* Usuario y logout */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button onClick={handleLogout} className="btn-secondary text-sm">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
