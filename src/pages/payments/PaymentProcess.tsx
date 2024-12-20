import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { loadStripe } from '@stripe/stripe-js';
import { StripeCheckoutForm } from '../../components/payments/StripeCheckoutForm';
import { useSelector } from 'react-redux';
import { selectAmount } from '../../store/features/paymentSlice';
import type { RootState } from '../../store/store';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const PaymentProcess = () => {
  const { courseId } = useParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const amount = useSelector((state: RootState) => selectAmount(state));

  useEffect(() => {
    let mounted = true;

    const initializePayment = async () => {
      if (!amount) {
        setError('No amount specified for payment');
        setLoading(false);
        return;
      }

      console.log('Initializing payment with amount:', amount);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/Payments/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency: "USD",
            returnUrl: `${window.location.origin}/return?session_id={CHECKOUT_SESSION_ID}`
          }),
        });

        if (!mounted) return;

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to initialize payment: ${errorText}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.clientSecret) {
          throw new Error('No client secret received from the server');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Payment initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializePayment();

    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">No client secret received. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            <FormattedMessage id="payment.complete" defaultMessage="Complete Your Payment" />
          </h1>
          
          <StripeCheckoutForm clientSecret={clientSecret} />
        </div>
      </div>
    </div>
  );
};
