import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Mail,
  AlertCircle,
  Check,
  CreditCard,
} from "lucide-react";
import { FormattedMessage } from "react-intl";
import { Button } from "../components/ui/Button";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { createOrder, convertCartOrderToPending } from "../lib/orders";
import { useDispatch } from "react-redux";
import { setAmount, setCourseName } from "../store/features/paymentSlice";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { clearCart } from "../store/features/cartSlice";

const ACADEMIES_COLLECTION =
  import.meta.env.VITE_FIREBASE_FIRESTORE_ROOT || "agaacademies";
const ACADEMY = import.meta.env.VITE_AGA_ACADEMY;

export const Checkout = () => {
  const navigate = useNavigate();
  const { state: cart } = useCart();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [purchaseComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Handle redirects in useEffect
    if (cart.items.length === 0) {
      navigate("/courses");
    } else if (!user) {
      navigate("/login");
    }
  }, [cart.items.length, user, navigate]);

  // If cart is empty or user is not logged in, render nothing while redirect happens
  if (cart.items.length === 0 || !user) {
    return null;
  }

  const handleCompletePurchase = async () => {
    setLoading(true);
    setError("");

    try {
      // First, try to convert an existing cart order to pending
      const cartOrderResult = await convertCartOrderToPending(user.uid);

      if (cartOrderResult.success) {
        console.log(
          "Converted cart order to pending:",
          cartOrderResult.orderId
        );
      } else {
        // If no cart order exists, create a new pending order
        const orderResult = await createOrder(
          user.uid,
          user.email!,
          cart.items,
          cart.total
        );

        if (!orderResult.success) {
          setError(orderResult.error || "payment.error.checkout");
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error completing purchase:", error);
      setError("payment.error.checkout");
      setLoading(false);
    }

    setTimeout(() => {
      clearCart();
      navigate("/courses");
    }, 3000);
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      // Calculate total amount in cents
      const totalAmount = cart.items.reduce(
        (total, item) => total + item.price * 100,
        0
      );

      // Create an array of course IDs to be purchased
      const courseIds = cart.items.map((item) => item.id);

      // First, try to convert an existing cart order to pending
      const cartOrderResult = await convertCartOrderToPending(user.uid);
      let orderId;

      if (cartOrderResult.success && cartOrderResult.orderId) {
        console.log(
          "Converted cart order to pending:",
          cartOrderResult.orderId
        );
        orderId = cartOrderResult.orderId;
      } else {
        // Check if there's an existing pending order in localStorage
        const existingOrderId = localStorage.getItem("pendingOrderId");

        if (existingOrderId) {
          try {
            // Try to get the existing order
            const orderDoc = await getDoc(
              doc(db, ACADEMIES_COLLECTION, ACADEMY, "orders", existingOrderId)
            );

            if (orderDoc.exists()) {
              const orderData = orderDoc.data();

              // Only reuse the order if it's still pending and belongs to this user
              if (
                orderData.status === "pending" &&
                orderData.userId === user.uid
              ) {
                console.log("Reusing existing pending order:", existingOrderId);

                // Update the order with new items and timestamp
                await updateDoc(
                  doc(
                    db,
                    ACADEMIES_COLLECTION,
                    ACADEMY,
                    "orders",
                    existingOrderId
                  ),
                  {
                    items: cart.items.map((item) => ({
                      courseId: item.id,
                      title: item.title,
                      price: item.price,
                    })),
                    total: cart.total,
                    updatedAt: serverTimestamp(),
                  }
                );

                orderId = existingOrderId;
              } else {
                // Order exists but is not pending or belongs to another user
                console.log(
                  "Existing order is not pending or belongs to another user, creating new order"
                );
                const orderResult = await createOrder(
                  user.uid,
                  user.email!,
                  cart.items,
                  cart.total
                );

                if (!orderResult.success) {
                  throw new Error(
                    orderResult.error || "payment.error.checkout"
                  );
                }

                orderId = orderResult.orderId;
              }
            } else {
              // Order doesn't exist, create a new one
              console.log("Order not found, creating new order");
              const orderResult = await createOrder(
                user.uid,
                user.email!,
                cart.items,
                cart.total
              );

              if (!orderResult.success) {
                throw new Error(orderResult.error || "payment.error.checkout");
              }

              orderId = orderResult.orderId;
            }
          } catch (orderError) {
            console.error("Error checking existing order:", orderError);
            // If there's an error checking the existing order, create a new one
            const orderResult = await createOrder(
              user.uid,
              user.email!,
              cart.items,
              cart.total
            );

            if (!orderResult.success) {
              throw new Error(orderResult.error || "payment.error.checkout");
            }

            orderId = orderResult.orderId;
          }
        } else {
          // No existing order ID, create a new order
          console.log("No existing order ID, creating new order");
          const orderResult = await createOrder(
            user.uid,
            user.email!,
            cart.items,
            cart.total
          );

          if (!orderResult.success) {
            throw new Error(orderResult.error || "payment.error.checkout");
          }

          orderId = orderResult.orderId;
        }
      }

      console.log("Using order ID for payment:", orderId);

      // Store the order ID in localStorage for fallback
      if (orderId) {
        localStorage.setItem("pendingOrderId", orderId);

        // Store the course IDs in localStorage for retrieval after payment
        localStorage.setItem("purchasedCourseIds", JSON.stringify(courseIds));

        // Store the amount in Redux
        dispatch(setAmount(totalAmount));

        // Store the course name in Redux - create a complete list of course titles
        if (cart.items.length > 0) {
          let courseName;

          if (cart.items.length === 1) {
            // If only one course, use its title
            courseName = cart.items[0].title;
          } else {
            // If multiple courses, list all titles
            courseName = cart.items.map((item) => item.title).join(", ");
          }

          dispatch(setCourseName(courseName));
        }

        // Navigate to payment process with order ID
        navigate(`/payment/process?orderId=${orderId}`);
      } else {
        throw new Error("Failed to create or retrieve order ID");
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
      setError("payment.error.checkout");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FormattedMessage id="payment.loading" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">
          <FormattedMessage id={error} defaultMessage={error} />
        </div>
        <Button onClick={() => setError("")}>
          <FormattedMessage id="payment.tryAgain" />
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16">
      <div className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {purchaseComplete ? (
            <div className="rounded-2xl bg-green-50 p-8 shadow-lg transform animate-fadeIn">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-6 text-3xl font-bold text-green-900 text-center">
                <FormattedMessage id="checkout.success" />
              </h2>
              <p className="mt-4 text-lg text-green-700 text-center">
                <FormattedMessage id="checkout.success.message" />
              </p>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
              {/* Cart summary */}
              <div className="lg:col-span-7">
                <h1 className="text-3xl font-bold text-gray-900">
                  <FormattedMessage id="cart.title" />
                </h1>
                <div className="mt-8 space-y-6">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 truncate">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          {item.instructor}
                        </p>
                      </div>
                      <p className="text-xl font-semibold text-gray-900">
                        ${item.price}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900">
                    <FormattedMessage id="cart.title" />
                  </h2>
                  <dl className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <dt className="text-base text-gray-600">
                        <FormattedMessage id="cart.total" />
                      </dt>
                      <dd className="text-base font-medium text-gray-900">
                        ${cart.total.toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                      <dt className="text-lg font-semibold text-gray-900">
                        <FormattedMessage id="cart.total" />
                      </dt>
                      <dd className="text-lg font-semibold text-blue-600">
                        ${cart.total.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Payment information */}
              <div className="mt-10 lg:col-span-5 lg:mt-0">
                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      <FormattedMessage id="checkout.payment.title" />
                    </h2>
                  </div>

                  <div className="mt-8 space-y-6">
                    {/* Zelle Payment */}
                    <div className="rounded-xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          <FormattedMessage id="checkout.payment.zelle" />
                        </h3>
                      </div>
                      <p className="mt-4 text-base text-gray-600">
                        <FormattedMessage id="footer.email" />
                      </p>
                    </div>

                    {/* PayPal Payment */}
                    <div className="rounded-xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <svg
                            className="h-5 w-5 text-blue-600"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.629h7.815c2.604 0 4.429.715 5.445 2.135.463.659.77 1.466.883 2.385.117.961.006 2.203-.33 3.604l-.002.01v.01c-.401 2.053-1.23 3.83-2.45 5.238-1.203 1.389-2.736 2.373-4.558 2.931-1.772.547-3.78.547-5.989.547h-.767c-.612 0-1.137.437-1.24 1.037l-1.265 5.766a.642.642 0 0 1-.63.512H2.47z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          <FormattedMessage id="checkout.payment.paypal" />
                        </h3>
                      </div>
                      <p className="mt-4 text-base text-gray-600">
                        <FormattedMessage id="footer.email" />
                      </p>
                    </div>

                    {/* Stripe Payment */}
                    <div className="rounded-xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          <FormattedMessage id="checkout.payment.stripe" />
                        </h3>
                      </div>
                      <Button
                        onClick={handleStripeCheckout}
                        disabled={loading}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <FormattedMessage id="admin.orders.processing" />
                        ) : (
                          <FormattedMessage id="checkout.payment.stripe.button" />
                        )}
                      </Button>
                    </div>

                    {/* Important Notice */}
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                      <div className="flex items-start">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-blue-900">
                            <FormattedMessage id="checkout.important" />
                          </h3>
                          <div className="mt-3 text-base text-blue-800">
                            <p>
                              <FormattedMessage id="checkout.payment.instructions" />
                            </p>
                            <ul className="mt-4 list-disc pl-5 space-y-2">
                              <li>
                                <FormattedMessage id="checkout.payment.instructions.email" />
                              </li>
                              <li>
                                <FormattedMessage id="checkout.payment.instructions.transaction" />
                              </li>
                              <li>
                                <FormattedMessage id="checkout.payment.instructions.courses" />
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-xl bg-red-50 p-6 text-base text-red-600 border border-red-100">
                        {error}
                      </div>
                    )}

                    {/* Complete Purchase Button */}
                    <Button
                      className="w-full py-6 text-lg font-semibold transition-transform duration-200 hover:transform hover:scale-[1.02]"
                      onClick={handleCompletePurchase}
                      disabled={loading}
                    >
                      {loading ? (
                        <FormattedMessage id="admin.orders.processing" />
                      ) : (
                        <FormattedMessage id="checkout.complete" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
