import { useParams, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../../components/ui/Button';

export const PaymentFailed = () => {
  const { courseId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-center text-gray-900">
            <FormattedMessage id="payment.failed.title" defaultMessage="Payment Failed" />
          </h1>
          
          <p className="mt-4 text-lg text-center text-gray-600">
            <FormattedMessage 
              id="payment.failed.message" 
              defaultMessage="We couldn't process your payment. Please try again or contact support if the problem persists."
            />
          </p>

          <div className="mt-8 flex justify-center space-x-4">
            <Link to={`/checkout/${courseId}`}>
              <Button>
                <FormattedMessage id="payment.failed.try-again" defaultMessage="Try Again" />
              </Button>
            </Link>
            <Link to="/support">
              <Button variant="outline">
                <FormattedMessage id="payment.failed.contact-support" defaultMessage="Contact Support" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
