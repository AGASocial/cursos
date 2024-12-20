import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { sendPasswordResetEmail } from '../lib/auth';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { success, error } = await sendPasswordResetEmail(email);
    
    if (success) {
      setSuccess(true);
    } else {
      setError(error || 'Failed to send reset email');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex min-h-screen">
        <div className="flex w-full items-center justify-center px-4 sm:px-6 lg:w-1/2 lg:px-8">
          <div className="w-full max-w-md">
            <Link 
              to="/login" 
              className="group mb-8 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" />
              <FormattedMessage id="auth.forgot.back" />
            </Link>
            
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-2 transform transition-transform hover:scale-110">
                <KeyRound className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                <FormattedMessage id="auth.forgot.title" />
              </h2>
              <p className="mt-2 text-base text-gray-600">
                <FormattedMessage id="auth.forgot.subtitle" />
              </p>
            </div>

            {success ? (
              <div className="mt-8 rounded-lg bg-green-50 p-6 text-center">
                <h3 className="text-lg font-medium text-green-900">
                  <FormattedMessage id="auth.forgot.success.title" />
                </h3>
                <p className="mt-2 text-green-700">
                  <FormattedMessage id="auth.forgot.success.message" />
                </p>
                <Link 
                  to="/login"
                  className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  <FormattedMessage id="auth.forgot.success.back" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <Input
                  label={<FormattedMessage id="auth.forgot.email" />}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                      <span><FormattedMessage id="auth.forgot.sending" /></span>
                    </div>
                  ) : (
                    <FormattedMessage id="auth.forgot.submit" />
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:block lg:w-1/2">
          <div className="relative h-full w-full">
            <img
              src="https://images.unsplash.com/photo-1555421689-d68471e189f2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
              alt="Forgot password"
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