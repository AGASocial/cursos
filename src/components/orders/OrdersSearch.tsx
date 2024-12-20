import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface OrdersSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalAmount: number;
  onRefresh: () => void;
  loading: boolean;
}

export const OrdersSearch: React.FC<OrdersSearchProps> = ({
  searchQuery,
  onSearchChange,
  totalAmount,
  onRefresh,
  loading
}) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar pedidos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="flex items-center space-x-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span><FormattedMessage id="orders.refresh" /></span>
          </Button>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              <FormattedMessage id="orders.total" />
            </p>
            <p className="text-2xl font-bold text-indigo-600">
              ${totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};