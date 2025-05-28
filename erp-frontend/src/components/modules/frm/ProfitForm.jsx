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

    const user = JSON.parse(localStorage.getItem("user"));
    setCanUpdateStatus(user?.role === "admin" || user?.role === "manager");
  }, [open, initialData, setValue, reset, setOpen]);

  const handleFormSubmit = async (data) => {
    try {
      const formData = {
        ...data,
        documents:
          data.documents instanceof FileList
            ? Array.from(data.documents)
            : data.documents,
      };

      await onSubmit(formData);
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to submit revenue");
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
                    {initialData ? "Edit Revenue" : "Add New Revenue"}
                  </Dialog.Title>

                  <form
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="space-y-6"
                  >
                    {!initialData && (
                      <div>
                        <label
                          htmlFor="profitNumber"
                          className="block text-sm font-medium text-gray-700 text-left"
                        >
                          Revenue Number
                        </label>
                        <input
                          type="text"
                          id="profitNumber"
                          {...register("profitNumber")}
                          className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                          readOnly
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 text-left"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={4}
                        {...register("description", {
                          required: "Description is required",
                        })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 py-3 px-4 text-base focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      />
                      {errors.description && (
                        <p className="mt-1 text-xs text-red-500 font-medium text-left">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="amount"
                          className="block text-sm font-medium text-gray-700 text-left"
                        >
                          Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
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
                            className="mt-1 block w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                          />
                        </div>
                        {errors.amount && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">
                            {errors.amount.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700 text-left"
                        >
                          Date
                        </label>
                        <input
                          type="date"
                          id="date"
                          {...register("date", {
                            required: "Date is required",
                          })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                        />
                        {errors.date && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">
                            {errors.date.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="category"
                          className="block text-sm font-medium text-gray-700 text-left"
                        >
                          Category
                        </label>
                        <select
                          id="category"
                          {...register("category", {
                            required: "Category is required",
                          })}
                          className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                        >
                          <option value="">Select Category</option>
                          <option value="sales">Sales</option>
                          <option value="services">Services</option>
                          <option value="investments">Investments</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.category && (
                          <p className="mt-1 text-xs text-red-500 font-medium text-left">
                            {errors.category.message}
                          </p>
                        )}
                      </div>

                      {canUpdateStatus && (
                        <div>
                          <label
                            htmlFor="status"
                            className="block text-sm font-medium text-gray-700 text-left"
                          >
                            Status
                          </label>
                          <select
                            id="status"
                            {...register("status", {
                              required: "Status is required",
                            })}
                            className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Realized">Realized</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          {errors.status && (
                            <p className="mt-1 text-xs text-red-500 font-medium text-left">
                              {errors.status.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-sm font-medium text-gray-700 text-left"
                      >
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        rows={4}
                        {...register("notes")}
                        className="mt-1 block w-full rounded-lg border border-gray-300 py-3 px-4 text-base focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="documents"
                        className="block text-sm font-medium text-gray-700 text-left"
                      >
                        Documents
                      </label>
                      <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-indigo-500 transition-colors">
                        <input
                          type="file"
                          id="documents"
                          multiple
                          {...register("documents")}
                          className="w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500 text-left">
                        Upload any supporting documents (optional)
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
                        {isSubmitting
                          ? "Submitting..."
                          : initialData
                          ? "Update Revenue"
                          : "Add Revenue"}
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

export default ProfitForm;