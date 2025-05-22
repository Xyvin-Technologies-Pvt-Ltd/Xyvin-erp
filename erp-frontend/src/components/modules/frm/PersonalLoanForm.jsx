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
          // Handle documents separately if needed
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
      setOpen(false); // Close modal on success
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Failed to submit loan application');
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {initialData ? 'Edit Loan Application' : 'New Loan Application'}
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-6 space-y-6">
                      <div>
                        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                          Purpose
                        </label>
                        <textarea
                          id="purpose"
                          rows={3}
                          {...register('purpose', { 
                            required: 'Purpose is required',
                            minLength: { value: 10, message: 'Purpose must be at least 10 characters' }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.purpose && (
                          <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                          Loan Amount
                        </label>
                        <input
                          type="number"
                          id="amount"
                          step="0.01"
                          min="0"
                          {...register('amount', { 
                            required: 'Amount is required',
                            min: { value: 0, message: 'Amount must be greater than 0' }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.amount && (
                          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="term" className="block text-sm font-medium text-gray-700">
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
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.term && (
                          <p className="mt-1 text-sm text-red-600">{errors.term.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
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
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.interestRate && (
                          <p className="mt-1 text-sm text-red-600">{errors.interestRate.message}</p>
                        )}
                      </div>

                      {amount && term && interestRate && (
                        <div className="rounded-md bg-blue-50 p-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">
                                Estimated Monthly Payment
                              </h3>
                              <div className="mt-2 text-sm text-blue-700">
                                ${calculateMonthlyPayment()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                          Employment Type
                        </label>
                        <select
                          id="employmentType"
                          {...register('employmentType', { 
                            required: 'Employment type is required'
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select employment type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                        </select>
                        {errors.employmentType && (
                          <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700">
                          Monthly Income
                        </label>
                        <input
                          type="number"
                          id="monthlyIncome"
                          step="0.01"
                          min="0"
                          {...register('monthlyIncome', { 
                            required: 'Monthly income is required',
                            min: { value: 0, message: 'Monthly income must be greater than 0' }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.monthlyIncome && (
                          <p className="mt-1 text-sm text-red-600">{errors.monthlyIncome.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          id="status"
                          {...register('status', { 
                            required: 'Status is required'
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        {errors.status && (
                          <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="documents" className="block text-sm font-medium text-gray-700">
                          Supporting Documents
                        </label>
                        <input
                          type="file"
                          id="documents"
                          multiple
                          {...register('documents')}
                          className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            hover:file:bg-primary-100"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Upload any supporting documents (pay slips, bank statements, etc.)
                        </p>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Submitting...' : initialData ? 'Update Application' : 'Submit Application'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
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