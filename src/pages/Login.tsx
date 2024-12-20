import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { LogIn, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { signIn } from '../lib/auth';
import { getUserData } from '../lib/users';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const { setIsAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { user, isAdmin, error } = await signIn(formData.email, formData.password);
    
    if (error) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }
    
    if (user) {
      setIsAdmin(isAdmin);
    }

    // Navigate to the page they tried to visit or home
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex min-h-screen">
        {/* Left side - Form */}
        <div className="flex w-full items-center justify-center px-4 sm:px-6 lg:w-1/2 lg:px-8">
          <div className="w-full max-w-md">
            <Link 
              to="/" 
              className="group mb-8 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
              Back to home
            </Link>
            
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-2 transform transition-transform hover:scale-110">
                <LogIn className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                <FormattedMessage id="auth.login.title" />
              </h2>
              <p className="mt-2 text-base text-gray-600">
                <FormattedMessage id="auth.login.subtitle" />
              </p>
            </div>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <Input
                  label={<FormattedMessage id="auth.login.email" />}
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label={<FormattedMessage id="auth.login.password" />}
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={error}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors duration-200"
                  />
                  <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-gray-700">
                    <FormattedMessage id="auth.login.remember" />
                  </label>
                </div>
                <div>
                  <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                    <FormattedMessage id="auth.login.forgot" />
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                    <span><FormattedMessage id="auth.login.signing" /></span>
                  </div>
                ) : (
                  <FormattedMessage id="auth.login.button" />
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              <FormattedMessage id="auth.login.signup.prompt" />{' '}
              <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                <FormattedMessage id="auth.login.signup.link" />
              </Link>
            </p>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:block lg:w-1/2">
          <div className="relative h-full w-full">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
              alt="Student studying"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};