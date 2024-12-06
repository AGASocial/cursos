import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, UserPlus, LogOut, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../lib/auth';
import { isAdmin } from '../../lib/admin';
import { CartDropdown } from '../cart/CartDropdown';

export const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-3 text-gray-900 hover:text-indigo-600 transition-colors duration-200"
            >
              <div className="p-2 rounded-xl bg-indigo-50 transform transition-transform hover:scale-110">
                <BookOpen className="h-7 w-7 text-indigo-600" />
              </div>
              <span className="text-xl font-bold tracking-tight">AGA Online Courses</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/courses" 
              className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200"
            >
              Courses
            </Link>
            {user ? (
              <div className="flex items-center space-x-6">
                {isAdmin(user.email!) && (
                  <Link to="/admin">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center space-x-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors duration-200"
                    >
                      <Shield className="h-4 w-4 text-indigo-600" />
                      <span className="text-indigo-600">Admin</span>
                    </Button>
                  </Link>
                )}
                <CartDropdown />
                <span className="text-gray-600 font-medium">{user.email}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors duration-200"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors duration-200"
                  >
                    <LogIn className="h-4 w-4 text-indigo-600" />
                    <span className="text-indigo-600">Login</span>
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    size="sm" 
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};