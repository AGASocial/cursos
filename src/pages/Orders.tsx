import React, { useState, useEffect } from 'react';
import { getUserOrders, type Order } from '../lib/orders';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { OrdersHeader } from '../components/orders/OrdersHeader';
import { OrdersTabs } from '../components/orders/OrdersTabs';
import { OrdersSearch } from '../components/orders/OrdersSearch';
import { OrdersList } from '../components/orders/OrdersList';

type TabType = 'pending' | 'completed';

export const Orders = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const fetchedOrders = await getUserOrders(user.uid);
    setOrders(fetchedOrders);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const matchesStatus = activeTab === 'pending' ? order.status === 'pending' : order.status === 'completed';
    const matchesSearch = order.items.some(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <OrdersHeader />
          <OrdersTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="space-y-6">
            <OrdersSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalAmount={totalAmount}
              onRefresh={fetchOrders}
              loading={loading}
            />
            <OrdersList 
              orders={filteredOrders} 
              loading={loading} 
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};