import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-pink-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-bold">
            🍭 Sweet Shop
          </Link>
          
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm">Welcome, {user.username}</span>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 bg-pink-700 hover:bg-pink-800 rounded-lg transition"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-pink-700 hover:bg-pink-800 rounded-lg transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

