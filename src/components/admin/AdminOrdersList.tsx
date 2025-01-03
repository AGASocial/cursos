import React, { useEffect, useState } from 'react';
import { Check, Clock, DollarSign, RefreshCw, Search, Filter, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { Input } from '../ui/Input';
import { getAllOrders, approveOrder, rejectOrder, type Order } from '../../lib/orders';
import { ConfirmationModal } from '../ui/ConfirmationModal';

export const AdminOrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
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

  const handleRejectClick = (order: Order) => {
    setOrderToReject(order);
  };

  const handleConfirmReject = async () => {
    if (!orderToReject) return;
    
    setRejectLoading(true);
    const { success } = await rejectOrder(orderToReject.id);
    
    if (success) {
      await fetchOrders();
    }
    
    setRejectLoading(false);
    setOrderToReject(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <FormattedMessage id="admin.orders.loading" />
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    // Text search
    const textMatch = 
      order.items.some(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      order.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Date filter
    const orderDate = new Date(order.createdAt);
    const dateMatch = 
      (!startDate || orderDate >= new Date(startDate)) &&
      (!endDate || orderDate <= new Date(endDate));

    // Amount filter
    const amountMatch = 
      (!minAmount || order.total >= parseFloat(minAmount)) &&
      (!maxAmount || order.total <= parseFloat(maxAmount));

    // Status filter
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;

    return textMatch && dateMatch && amountMatch && statusMatch;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por ID, email o productos..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              className="flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-4">
                <div className="w-44">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <Input
                    type="date"
                    className="h-9 text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="w-44">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <Input
                    type="date"
                    className="h-9 text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      className="h-9 text-sm"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      className="h-9 text-sm"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-40">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-9 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completados</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
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
        ) : (
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
                {filteredOrders.map((order) => (
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
                            : order.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status === 'completed' ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            <span><FormattedMessage id="admin.orders.completed" /></span>
                          </>
                        ) : order.status === 'rejected' ? (
                          <>
                            <X className="mr-1 h-3 w-3" />
                            <span><FormattedMessage id="admin.orders.rejected" /></span>
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            <span><FormattedMessage id="admin.orders.pending" /></span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {order.status === 'pending' && (
                        <div className="flex justify-end space-x-2">
                          <Tooltip content={<FormattedMessage id="admin.orders.tooltip.approve" />}>
                            <Button 
                              size="sm"
                              onClick={() => handleApproveOrder(order.id)}
                              disabled={processingOrder === order.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingOrder === order.id ? (
                                <FormattedMessage id="admin.orders.processing" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </Tooltip>
                          <Tooltip content={<FormattedMessage id="admin.orders.tooltip.reject" />}>
                            <Button
                              size="sm"
                              onClick={() => handleRejectClick(order)}
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={orderToReject !== null}
        onClose={() => setOrderToReject(null)}
        onConfirm={handleConfirmReject}
        title={<FormattedMessage id="admin.orders.reject.title" />}
        message={<FormattedMessage id="admin.orders.reject.message" />}
        confirmText={<FormattedMessage id="admin.orders.reject" />}
        cancelText={<FormattedMessage id="admin.orders.reject.cancel" />}
        loading={rejectLoading}
      />
    </div>
  );
};