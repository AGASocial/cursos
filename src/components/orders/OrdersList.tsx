import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Check, Clock, RefreshCw } from 'lucide-react';
import type { Order } from '../../lib/orders';
import { Button } from '../ui/Button';

interface OrdersListProps {
  orders: Order[];
  loading: boolean;
}

export const OrdersList: React.FC<OrdersListProps> = ({ orders, loading }) => {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">
          <FormattedMessage id="orders.loading" />
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">
          <FormattedMessage id="orders.empty" />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {order.status === 'completed' ? (
                <div className="flex items-center text-green-600">
                  <Check className="h-5 w-5 mr-1" />
                  <FormattedMessage id="orders.status.completed" />
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <Clock className="h-5 w-5 mr-1" />
                  <FormattedMessage id="orders.status.pending" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-900">{item.title}</span>
                <span className="font-medium">${item.price}</span>
              </div>
            ))}
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-medium text-gray-900">
                <FormattedMessage id="orders.total" />
              </span>
              <span className="text-lg font-bold text-indigo-600">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};