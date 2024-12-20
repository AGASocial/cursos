import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { registerUser } from '../lib/auth';
import { createUser } from '../lib/users';

export const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { user, error: authError } = await registerUser(formData.email, formData.password);
    
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (user) {
      const { error: userError } = await createUser(user.uid, user.email!);
      if (userError) {
        setError(userError);
        setLoading(false);
        return;
      }
    }

    navigate('/');
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
              <FormattedMessage id="auth.register.back" />
            </Link>
            
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-2 transform transition-transform hover:scale-110">
                <UserPlus className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                <FormattedMessage id="auth.register.title" />
              </h2>
              <p className="mt-2 text-base text-gray-600">
                <FormattedMessage id="auth.register.subtitle" />
              </p>
            </div>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <Input
                  label={<FormattedMessage id="auth.register.email" />}
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label={<FormattedMessage id="auth.register.password" />}
                  type="password"
                  required
                  showPasswordToggle
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Input
                  label={<FormattedMessage id="auth.register.confirmPassword" />}
                  type="password"
                  required
                  showPasswordToggle
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  error={error}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                    <span><FormattedMessage id="auth.register.creating" /></span>
                  </div>
                ) : (
                  <FormattedMessage id="auth.register.button" />
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              <FormattedMessage id="auth.register.login.prompt" />{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
                <FormattedMessage id="auth.register.login.link" />
              </Link>
            </p>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:block lg:w-1/2">
          <div className="relative h-full w-full">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
              alt="Students studying"
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