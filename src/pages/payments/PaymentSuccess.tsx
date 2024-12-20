import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../../components/ui/Button';

export const PaymentSuccess = () => {
  const { courseId } = useParams();

  useEffect(() => {
    // Here you can add logic to verify the payment status
    // and activate the course for the user
    const verifyPayment = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/Payments/verify/${courseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error('Failed to verify payment');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    };

    verifyPayment();
  }, [courseId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-center text-gray-900">
            <FormattedMessage id="payment.success.title" defaultMessage="Payment Successful!" />
          </h1>
          
          <p className="mt-4 text-lg text-center text-gray-600">
            <FormattedMessage 
              id="payment.success.message" 
              defaultMessage="Thank you for your purchase. You can now access your course."
            />
          </p>

          <div className="mt-8 flex justify-center">
            <Link to={`/course/${courseId}`}>
              <Button>
                <FormattedMessage id="payment.success.view-course" defaultMessage="View Course" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
