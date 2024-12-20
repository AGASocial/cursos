import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeCheckoutFormProps {
  clientSecret: string;
}

export const StripeCheckoutForm = ({ clientSecret }: StripeCheckoutFormProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if payment was successful on return
    const clientSecretParam = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (clientSecretParam) {
      navigate('/return');
    }
  }, [navigate]);

  const options = {
    clientSecret,
    onComplete: () => {
      navigate('/return');
    },
  };

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={options}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};
