import { format } from 'date-fns';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProfitCard = ({ profit, onEdit, onDelete, formatCurrency }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Revenue No.</p>
          <p className="text-sm font-semibold text-gray-900">{profit.profitNumber}</p>
        </div>
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          profit.status === 'Realized' ? 'bg-green-100 text-green-800' :
          profit.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {profit.status}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-500">Description</p>
          <p className="text-sm text-gray-900">{profit.description}</p>
        </div>

        <div className="flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Amount</p>
            <p className="text-sm text-gray-900">{formatCurrency(profit.amount)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Date</p>
            <p className="text-sm text-gray-900">{format(new Date(profit.date), 'MMM d, yyyy')}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Category</p>
          <p className="text-sm text-gray-900 capitalize">{profit.category}</p>
        </div>
      </div>

      {profit.status === 'Pending' && (
        <div className="mt-4 flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={() => onEdit(profit)}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onDelete(profit)}
            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfitCard; 