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
      // Reset form first
      reset();
      
      // Set basic fields
      setValue('purpose', initialData.purpose);
      setValue('amount', initialData.amount);
      setValue('department', initialData.department);
      setValue('justification', initialData.justification);
      
      // Set repayment plan fields
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
      // Create a plain object with the form data
      const formData = {
        purpose: data.purpose,
        amount: data.amount,
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
    } catch (error) {
      console.error('Form submission error:', error);
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
                      {initialData ? 'Edit Office Loan Request' : 'New Office Loan Request'}
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
                          Amount
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
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                          Department
                        </label>
                        <select
                          id="department"
                          {...register('department', { required: 'Department is required' })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select Department</option>
                          <option value="IT">IT</option>
                          <option value="HR">HR</option>
                          <option value="Finance">Finance</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Operations">Operations</option>
                        </select>
                        {errors.department && (
                          <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="justification" className="block text-sm font-medium text-gray-700">
                          Justification
                        </label>
                        <textarea
                          id="justification"
                          rows={3}
                          {...register('justification', { 
                            required: 'Justification is required',
                            minLength: { value: 10, message: 'Justification must be at least 10 characters' }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.justification && (
                          <p className="mt-1 text-sm text-red-600">{errors.justification.message}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">Repayment Plan</h4>
                        
                        <div>
                          <label htmlFor="repaymentPlan.installments" className="block text-sm font-medium text-gray-700">
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          {errors.repaymentPlan?.installments && (
                            <p className="mt-1 text-sm text-red-600">{errors.repaymentPlan.installments.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="repaymentPlan.frequency" className="block text-sm font-medium text-gray-700">
                            Payment Frequency
                          </label>
                          <select
                            id="repaymentPlan.frequency"
                            {...register('repaymentPlan.frequency', { required: 'Payment frequency is required' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="">Select Frequency</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annually">Annually</option>
                          </select>
                          {errors.repaymentPlan?.frequency && (
                            <p className="mt-1 text-sm text-red-600">{errors.repaymentPlan.frequency.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="repaymentPlan.startDate" className="block text-sm font-medium text-gray-700">
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="repaymentPlan.startDate"
                            {...register('repaymentPlan.startDate', { required: 'Start date is required' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          {errors.repaymentPlan?.startDate && (
                            <p className="mt-1 text-sm text-red-600">{errors.repaymentPlan.startDate.message}</p>
                          )}
                        </div>
                      </div>

                      {amount && installments && (
                        <div className="rounded-md bg-blue-50 p-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">
                                Estimated Installment Amount
                              </h3>
                              <div className="mt-2 text-sm text-blue-700">
                                ${calculateInstallmentAmount()} per {frequency?.toLowerCase() || 'installment'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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
                          Upload supporting documents (quotations, invoices, etc.)
                        </p>
                        {errors.documents && (
                          <p className="mt-1 text-sm text-red-600">{errors.documents.message}</p>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Submitting...' : initialData ? 'Update Request' : 'Submit Request'}
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

export default OfficeLoanForm; 