import { useEffect, useState, useRef } from "react";
// import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { FormattedMessage } from "react-intl";
// import { loadStripe } from "@stripe/stripe-js";
// import { StripeCheckoutForm } from "../../components/payments/StripeCheckoutForm";
import { useSelector } from "react-redux";
import { selectAmount, selectCourseName } from "../../store/features/paymentSlice";
import type { RootState } from "../../store/store";

export const PaymentProcess = () => {
  const [error, setError] = useState<string | null>(null);
  const amount = useSelector((state: RootState) => selectAmount(state));
  const courseName = useSelector((state: RootState) => selectCourseName(state));
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    // Retrieve course IDs from localStorage
    const storedCourseIds = localStorage.getItem('purchasedCourseIds');
    if (storedCourseIds) {
      try {
        setCourseIds(JSON.parse(storedCourseIds));
      } catch (error) {
        console.error('Error parsing course IDs from localStorage:', error);
        setError('payment.error.processing');
        return;
      }
    } else {
      console.warn('No course IDs found in localStorage');
    }

    // Check if amount is available
    if (!amount) {
      setError("payment.error.amount");
      return;
    }

    // Check if course name is available
    if (!courseName) {
      console.warn("No course name specified, using default");
    }

    // Submit the form automatically
    if (formRef.current) {
      formRef.current.submit();
    }
  }, [amount, courseName]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">
          <FormattedMessage id={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin mb-4" />
      <span className="mb-8">
        <FormattedMessage id="payment.redirecting" />
      </span>

      {/* Hidden form that will be submitted automatically */}
      <form
        ref={formRef}
        method="POST"
        action={`${
          import.meta.env.VITE_API_URL
        }/Payments/create-checkout-session-redirect`}
        className="hidden"
      >
        <input type="hidden" name="amount" value={amount} />
        <input type="hidden" name="currency" value="USD" />
        <input
          type="hidden"
          name="returnUrl"
          value={`${window.location.origin}/return`}
        />
        <input
          type="hidden"
          name="productName"
          value={courseName ? `Cursos: ${courseName}` : "Pago de Cursos"}
        />
        <input
          type="hidden"
          name="courseIds"
          value={JSON.stringify(courseIds)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};
