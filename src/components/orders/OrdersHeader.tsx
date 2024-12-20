import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Receipt } from 'lucide-react';

export const OrdersHeader = () => {
  return (
    <div className="mb-8 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
        <Receipt className="h-8 w-8 text-indigo-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">
        <FormattedMessage id="orders.title" />
      </h1>
    </div>
  );
};