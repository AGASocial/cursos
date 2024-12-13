import React, { useEffect, useState } from 'react';
import { Check, Clock, DollarSign } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../ui/Button';
import { getAllOrders, approveOrder, type Order } from '../../lib/orders';

export const AdminOrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const fetchedOrders = await getAllOrders();
    setOrders(fetchedOrders);
    setLoading(false);
  };

  const handleApproveOrder = async (orderId: string) => {
    setProcessingOrder(orderId);
    const { success } = await approveOrder(orderId);
    if (success) {
      await fetchOrders();
    }
    setProcessingOrder(null);
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">
          <FormattedMessage id="admin.orders.loading" />
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            <FormattedMessage id="admin.orders.empty" />
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            <FormattedMessage id="admin.orders.empty.message" />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="admin.orders.title" />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="admin.orders.items" />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="admin.orders.total" />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="admin.orders.status" />
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              <FormattedMessage id="admin.actions" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="whitespace-nowrap px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {order.userEmail}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-900">
                      {item.title}
                    </div>
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center text-sm font-medium text-gray-900">
                  <DollarSign className="mr-1 h-4 w-4" />
                  {order.total.toFixed(2)}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {order.status === 'completed' ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      <FormattedMessage id="admin.orders.completed" />
                    </>
                  ) : (
                    <>
                      <Clock className="mr-1 h-3 w-3" />
                      <FormattedMessage id="admin.orders.pending" />
                    </>
                  )}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                {order.status === 'pending' && (
                  <Button
                    onClick={() => handleApproveOrder(order.id)}
                    disabled={processingOrder === order.id}
                  >
                    {processingOrder === order.id ? (
                      <FormattedMessage id="admin.orders.processing" />
                    ) : (
                      <FormattedMessage id="admin.orders.approve" />
                    )}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};