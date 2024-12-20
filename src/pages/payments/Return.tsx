import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const Return = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/Payments/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      })
      .catch((error) => {
        console.error('Error fetching session status:', error);
        setStatus('error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (status === 'open') {
    return <Navigate to="/checkout" />;
  }

  if (status === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your purchase! A confirmation email will be sent to {customerEmail}.
            </p>
            <p className="text-gray-600">
              If you have any questions, please email{' '}
              <a 
                href="mailto:support@example.com" 
                className="text-blue-600 hover:text-blue-800"
              >
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Error</h1>
          <p className="text-gray-600">
            There was an error processing your payment. Please try again or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};
