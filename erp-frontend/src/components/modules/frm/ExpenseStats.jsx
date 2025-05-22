import { CurrencyDollarIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const ExpenseStats = ({ stats }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const cards = [
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalAmount),
      description: `${stats.totalCount || 0} total expenses`,
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Paid Expenses',
      value: formatCurrency(stats.paidAmount),
      description: `${stats.paidCount || 0} approved expenses`,
      icon: CheckCircleIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Expenses',
      value: formatCurrency(stats.pendingAmount),
      description: `${stats.pendingCount || 0} pending expenses`,
      icon: ClockIcon,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
        >
          <dt>
            <div className={`absolute rounded-md p-3 ${card.color}`}>
              <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">{card.title}</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6">
            <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <span className="font-medium text-gray-500">
                  {card.description}
                </span>
              </div>
            </div>
          </dd>
        </div>
      ))}
    </div>
  );
};

export default ExpenseStats; 