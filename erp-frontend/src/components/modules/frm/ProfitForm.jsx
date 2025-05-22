import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import frmService from "@/api/frmService";
import { toast } from "react-hot-toast";

const ProfitForm = ({ open, setOpen, onSubmit, initialData = null }) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      notes: "",
      documents: [],
      status: "Pending",
    },
  });

  const [canUpdateStatus, setCanUpdateStatus] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        Object.keys(initialData).forEach((key) => {
          if (key !== "documents") {
            setValue(key, initialData[key]);
          }
        });
      } else {
        reset({
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          category: "",
          notes: "",
          documents: [],
          status: "Pending",
        });

        const fetchNextProfitNumber = async () => {
          try {
            const response = await frmService.getNextProfitNumber();
            if (response.success && response.data?.profit?.profitNumber) {
              setValue("profitNumber", response.data.profit.profitNumber);
            } else {
              toast.error("Failed to get profit number.");
            }
          } catch (error) {
            toast.error(error.message || "Failed to get profit number.");
            setOpen(false);
          }
        };
        fetchNextProfitNumber();
      }
    }

    // Check user permissions when component mounts
    const user = JSON.parse(localStorage.getItem("user"));
    setCanUpdateStatus(user?.role === "admin" || user?.role === "manager");
  }, [open, setValue, reset]);

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
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
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      {initialData ? "Edit Revenue" : "Add New Revenue"}
                    </Dialog.Title>

                    <form
                      onSubmit={handleSubmit(handleFormSubmit)}
                      className="mt-6 space-y-6"
                    >
                      {!initialData ? (
                        <div>
                          <label
                            htmlFor="profitNumber"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Revenue Number
                          </label>
                          <input
                            type="text"
                            id="profitNumber"
                            {...register("profitNumber")}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            readOnly
                          />
                        </div>
                      ) : null}

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <input
                          type="text"
                          id="description"
                          {...register("description", {
                            required: "Description is required",
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.description.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="amount"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Amount
                        </label>
                        <input
                          type="number"
                          id="amount"
                          step="0.01"
                          min="0"
                          {...register("amount", {
                            required: "Amount is required",
                            min: {
                              value: 0,
                              message: "Amount must be greater than 0",
                            },
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.amount && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.amount.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date
                        </label>
                        <input
                          type="date"
                          id="date"
                          {...register("date", {
                            required: "Date is required",
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.date && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.date.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="category"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Category
                        </label>
                        <select
                          id="category"
                          {...register("category", {
                            required: "Category is required",
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="">Select Category</option>
                          <option value="sales">Sales</option>
                          <option value="services">Services</option>
                          <option value="investments">Investments</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.category && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.category.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="notes"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          rows={3}
                          {...register("notes")}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="documents"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Documents
                        </label>
                        <input
                          type="file"
                          id="documents"
                          multiple
                          {...register("documents")}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                      </div>

                      {canUpdateStatus && (
                        <div>
                          <label
                            htmlFor="status"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Status
                          </label>
                          <select
                            id="status"
                            {...register("status")}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Realized">Realized</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting
                            ? "Submitting..."
                            : initialData
                            ? "Update   Revenue"
                            : "Add Revenue"}
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

export default ProfitForm;
