import React, { useEffect } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../ui/Button';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const CartDropdown = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { state, removeItem, loadCartFromFirebase } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load cart when component mounts or when user changes
  useEffect(() => {
    if (user) {
      // Check if cart is empty before loading from Firebase
      if (state.items.length === 0) {
        console.log('CartDropdown: Cart is empty, attempting to load from Firebase');
        loadCartFromFirebase(user.uid)
          .then(success => {
            if (success) {
              console.log('CartDropdown: Successfully loaded cart from Firebase');
            } else {
              console.log('CartDropdown: No cart found in Firebase or failed to load');
            }
          })
          .catch(error => {
            console.error('CartDropdown: Error loading cart from Firebase:', error);
          });
      } else {
        console.log('CartDropdown: Cart already has items, skipping Firebase load');
      }
    }
  }, [user, state.items.length, loadCartFromFirebase]);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-gray-700 hover:text-blue-600"
      >
        <ShoppingCart className="h-5 w-5" />
        {state.items.length > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
            {state.items.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg bg-white p-4 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              <FormattedMessage id="cart.title" />
            </h3>
            
            {state.items.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                <FormattedMessage id="cart.empty" />
              </p>
            ) : (
              <>
                <div className="mt-4 space-y-4">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="h-16 w-24 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-500">${item.price}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-900">
                      <FormattedMessage id="cart.total" />
                    </span>
                    <span className="text-base font-medium text-gray-900">
                      ${state.total.toFixed(2)}
                    </span>
                  </div>
                  <Button className="mt-4 w-full" onClick={handleCheckout}>
                    <FormattedMessage id="cart.checkout" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};