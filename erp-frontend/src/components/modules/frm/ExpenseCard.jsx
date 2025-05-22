import { format } from 'date-fns';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const ExpenseCard = ({ expense, onEdit, onDelete, formatCurrency }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {expense.expenseNumber}
          </h3>
          <p className="text-sm text-gray-500">{expense.description}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            expense.status === 'Approved' ? 'bg-green-100 text-green-800' :
            expense.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}
        >
          {expense.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">Amount</p>
          <p className="mt-1 text-sm text-gray-900">
            {formatCurrency(expense.amount)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Date</p>
          <p className="mt-1 text-sm text-gray-900">
            {format(new Date(expense.date), 'MMM d, yyyy')}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Category</p>
          <p className="mt-1 text-sm text-gray-900">
            {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Notes</p>
          <p className="mt-1 text-sm text-gray-900 truncate" title={expense.notes}>
            {expense.notes || "No notes"}
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => onEdit(expense)}
          className="text-black hover:text-gray-800"
        >
          <PencilIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        {expense.status === "Pending" ? (
          <button
            onClick={() => onDelete(expense)}
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <button
            disabled
            className="text-gray-300 cursor-not-allowed"
            title="Only pending expenses can be deleted"
          >
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseCard; 