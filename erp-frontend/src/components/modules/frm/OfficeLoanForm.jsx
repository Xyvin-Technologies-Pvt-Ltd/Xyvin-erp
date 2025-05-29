import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

const OfficeLoanForm = ({ open, setOpen, onSubmit, initialData = null }) => {
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
      department: '',
      justification: '',
      repaymentPlan: {
        installments: '',
        frequency: '',
        startDate: ''
      },
      documents: []
    }
  });

  const amount = watch('amount');
  const installments = watch('repaymentPlan.installments');
  const frequency = watch('repaymentPlan.frequency');

  useEffect(() => {
    if (initialData) {
      reset();
      setValue('purpose', initialData.purpose);
      setValue('amount', initialData.amount);
      setValue('department', initialData.department);
      setValue('justification', initialData.justification);
      if (initialData.repaymentPlan) {
        setValue('repaymentPlan.installments', initialData.repaymentPlan.installments);
        setValue('repaymentPlan.frequency', initialData.repaymentPlan.frequency);
        setValue('repaymentPlan.startDate', initialData.repaymentPlan.startDate ? 
          format(new Date(initialData.repaymentPlan.startDate), 'yyyy-MM-dd') : '');
      }
    }
  }, [initialData, setValue, reset]);

  const calculateInstallmentAmount = () => {
    if (!amount || !installments) return 0;
    const principal = parseFloat(amount);
    const numberOfInstallments = parseFloat(installments);
    const installmentAmount = principal / numberOfInstallments;
    return isNaN(installmentAmount) ? 0 : installmentAmount.toFixed(2);
  };

  const handleFormSubmit = async (data) => {
    try {
      const formData = {
        purpose: data.purpose,
        amount: parseFloat(data.amount),
        department: data.department,
        justification: data.justification,
        repaymentPlan: {
          installments: parseInt(data.repaymentPlan.installments),
          frequency: data.repaymentPlan.frequency,
          startDate: data.repaymentPlan.startDate
        },
        documents: Array.from(data.documents || [])
      };

      await onSubmit(formData);
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Form submission error:', error);
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
                    {initialData ? 'Edit Office Loan Request' : 'New Office Loan Request'}
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
                          Amount
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
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 text-left">
                          Department
                        </label>
                        <select
                          id="department"
                          {...register('department', { required: 'Department is required' })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                        >
                          <option value="">Select Department</option>
                          <option value="IT">IT</option>
                          <option value="HR">HR</option>
                          <option value="Finance">Finance</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Operations">Operations</option>
                        </select>
                        {errors.department && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.department.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="justification" className="block text-sm font-medium text-gray-700 text-left">
                        Justification
                      </label>
                      <textarea
                        id="justification"
                        rows={4}
                        {...register('justification', { 
                          required: 'Justification is required',
                          minLength: { value: 10, message: 'Justification must be at least 10 characters' }
                        })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 py-3 px-4 text-base focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      />
                      {errors.justification && (
                        <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.justification.message}</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-900 text-left">Repayment Plan</h4>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="repaymentPlan.installments" className="block text-sm font-medium text-gray-700 text-left">
                            Number of Installments
                          </label>
                          <input
                            type="number"
                            id="repaymentPlan.installments"
                            min="1"
                            max="60"
                            {...register('repaymentPlan.installments', { 
                              required: 'Number of installments is required',
                              min: { value: 1, message: 'Must have at least 1 installment' },
                              max: { value: 60, message: 'Cannot exceed 60 installments' }
                            })}
                            className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                          />
                          {errors.repaymentPlan?.installments && (
                            <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.repaymentPlan.installments.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="repaymentPlan.frequency" className="block text-sm font-medium text-gray-700 text-left">
                            Payment Frequency
                          </label>
                          <select
                            id="repaymentPlan.frequency"
                            {...register('repaymentPlan.frequency', { required: 'Payment frequency is required' })}
                            className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                          >
                            <option value="">Select Frequency</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annually">Annually</option>
                          </select>
                          {errors.repaymentPlan?.frequency && (
                            <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.repaymentPlan.frequency.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="repaymentPlan.startDate" className="block text-sm font-medium text-gray-700 text-left">
                          Start Date
                        </label>
                        <input
                          type="date"
                          id="repaymentPlan.startDate"
                          {...register('repaymentPlan.startDate', { required: 'Start date is required' })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                        />
                        {errors.repaymentPlan?.startDate && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.repaymentPlan.startDate.message}</p>
                        )}
                      </div>
                    </div>

                    {amount && installments && (
                      <div className="rounded-lg bg-indigo-50 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-indigo-800 text-left">
                              Estimated Installment Amount
                            </h3>
                            <div className="mt-1 text-sm text-indigo-700 text-left">
                              ₹{calculateInstallmentAmount()} per {frequency?.toLowerCase() || 'installment'}
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
                          className="w-full text-sm text-gray-500 file: px-4 file:py-2 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 text-left">
                        Upload supporting documents (quotations, invoices, etc.)
                      </p>
                      {errors.documents && (
                        <p className="mt-1 text-xs text-red-500 font-medium text-left">{errors.documents.message}</p>
                      )}
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
                        {isSubmitting ? 'Submitting...' : initialData ? 'Update Request' : 'Submit Request'}
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

export default OfficeLoanForm;