import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const PersonalLoanForm = ({ open, setOpen, onSubmit, initialData = null }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      purpose: '',
      amount: '',
      term: '',
      interestRate: '',
      employmentType: '',
      monthlyIncome: '',
      status: 'Pending',
      documents: []
    }
  });

  const amount = watch('amount');
  const term = watch('term');
  const interestRate = watch('interestRate');

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach(key => {
        if (key === 'documents') {
          return;
        }
        setValue(key, initialData[key]);
      });
    }
  }, [initialData, setValue]);

  const calculateMonthlyPayment = () => {
    if (!amount || !term || !interestRate) return 0;
    
    const principal = parseFloat(amount);
    const monthlyRate = (parseFloat(interestRate) / 100) / 12;
    const numberOfPayments = parseFloat(term);
    
    const monthlyPayment = 
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return isNaN(monthlyPayment) ? 0 : monthlyPayment.toFixed(2);
  };

  const handleFormSubmit = async (data) => {
    try {
      const loanData = {
        purpose: data.purpose,
        amount: parseFloat(data.amount),
        term: parseInt(data.term),
        interestRate: parseFloat(data.interestRate),
        employmentType: data.employmentType,
        monthlyIncome: parseFloat(data.monthlyIncome),
        monthlyPayment: parseFloat(calculateMonthlyPayment()),
        status: data.status,
        documents: data.documents || []
      };

      if (data.documents?.length > 0) {
        const formData = new FormData();
        const loanDataWithoutDocs = { ...loanData };
        delete loanDataWithoutDocs.documents;
        formData.append('data', JSON.stringify(loanDataWithoutDocs));
        Array.from(data.documents).forEach(file => {
          formData.append('documents', file);
        });
        await onSubmit(formData);
      } else {
        await onSubmit(loanData);
      }
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to submit loan application');
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white p-6 shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="w-full">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold text-gray-900 mb-6 text-left"
                  >
                    {initialData ? 'Edit Loan Application' : 'New Loan Application'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div>
                      <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 text-left">
                        Purpose
                      </label>
                      <textarea
                        id="purpose"
                        rows={4}
                        {...register('purpose', { 
                          required: 'Purpose is required',
                          minLength: { value: 10, message: 'Purpose must be at least 10 characters' }
                        })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 py-3 px-4 text-base focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      />
                      {errors.purpose && (
                        <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.purpose.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 text-left">
                          Loan Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            id="amount"
                            step="0.01"
                            min="0"
                            {...register('amount', { 
                              required: 'Amount is required',
                              min: { value: 0, message: 'Amount must be greater than 0' }
                            })}
                            className="mt-1 block w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                          />
                        </div>
                        {errors.amount && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.amount.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="term" className="block text-sm font-medium text-gray-700 text-left">
                          Term (Months)
                        </label>
                        <input
                          type="number"
                          id="term"
                          min="1"
                          max="60"
                          {...register('term', { 
                            required: 'Term is required',
                            min: { value: 1, message: 'Term must be at least 1 month' },
                            max: { value: 60, message: 'Term cannot exceed 60 months' }
                          })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                        />
                        {errors.term && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.term.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 text-left">
                          Interest Rate (%)
                        </label>
                        <input
                          type="number"
                          id="interestRate"
                          step="0.01"
                          min="0"
                          max="30"
                          {...register('interestRate', { 
                            required: 'Interest rate is required',
                            min: { value: 0, message: 'Interest rate cannot be negative' },
                            max: { value: 30, message: 'Interest rate cannot exceed 30%' }
                          })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                        />
                        {errors.interestRate && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.interestRate.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 text-left">
                          Employment Type
                        </label>
                        <select
                          id="employmentType"
                          {...register('employmentType', { 
                            required: 'Employment type is required'
                          })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                        >
                          <option value="">Select employment type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                        </select>
                        {errors.employmentType && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.employmentType.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 text-left">
                          Monthly Income
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            id="monthlyIncome"
                            step="0.01"
                            min="0"
                            {...register('monthlyIncome', { 
                              required: 'Monthly income is required',
                              min: { value: 0, message: 'Monthly income must be greater than 0' }
                            })}
                            className="mt-1 block w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                          />
                        </div>
                        {errors.monthlyIncome && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.monthlyIncome.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 text-left">
                          Status
                        </label>
                        <select
                          id="status"
                          {...register('status', { 
                            required: 'Status is required'
                          })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        {errors.status && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.status.message}</p>
                        )}
                      </div>
                    </div>

                    {amount && term && interestRate && (
                      <div className="rounded-lg bg-indigo-50 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-indigo-800 text-left">
                              Estimated Monthly Payment
                            </h3>
                            <div className="mt-1 text-sm text-indigo-700 text-left">
                              ₹{calculateMonthlyPayment()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="documents" className="block text-sm font-medium text-gray-700 text-left">
                        Supporting Documents
                      </label>
                      <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-indigo-500 transition-colors">
                        <input
                          type="file"
                          id="documents"
                          multiple
                          {...register('documents')}
                          className="w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 text-left">
                        Upload any supporting documents (pay slips, bank statements, etc.)
                      </p>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting && (
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        {isSubmitting ? 'Submitting...' : initialData ? 'Update Application' : 'Submit Application'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default PersonalLoanForm;