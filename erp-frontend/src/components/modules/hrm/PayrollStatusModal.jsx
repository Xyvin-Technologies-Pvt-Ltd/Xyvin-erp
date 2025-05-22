import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import useHrmStore from "@/stores/useHrmStore";

const validationSchema = Yup.object({
  status: Yup.string()
    .required("Status is required")
    .oneOf(["pending", "processed", "paid"], "Invalid status"),
  remarks: Yup.string(),
});

const PayrollStatusModal = ({ payroll, onClose, onSuccess }) => {
  const { updatePayroll } = useHrmStore();
  const formik = useFormik({
    initialValues: {
      status: payroll?.status || "pending",
      remarks: payroll?.remarks || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await updatePayroll(payroll._id, values);
        toast.success("Payroll status updated successfully");
        onSuccess();
      } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    },
  });

  if (!payroll) return null;

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 mb-4"
                    >
                      Update Payroll Status
                    </Dialog.Title>

                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Employee Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Name</p>
                          <p className="font-medium">
                            {payroll.employee?.firstName}{" "}
                            {payroll.employee?.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Position</p>
                          <p className="font-medium">
                            {payroll.employee?.position?.title}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Department</p>
                          <p className="font-medium">
                            {payroll.employee?.department?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Net Salary</p>
                          <p className="font-medium">
                            ${payroll.netSalary?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="status"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-black focus:outline-none focus:ring-black sm:text-sm"
                          {...formik.getFieldProps("status")}
                        >
                          <option value="pending">Pending</option>
                          <option value="processed">Processed</option>
                          <option value="paid">Paid</option>
                        </select>
                        {formik.touched.status && formik.errors.status && (
                          <p className="mt-1 text-sm text-red-600">
                            {formik.errors.status}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="remarks"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Remarks
                        </label>
                        <textarea
                          id="remarks"
                          name="remarks"
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                          placeholder="Add any notes or comments..."
                          {...formik.getFieldProps("remarks")}
                        />
                        {formik.touched.remarks && formik.errors.remarks && (
                          <p className="mt-1 text-sm text-red-600">
                            {formik.errors.remarks}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto"
                        >
                          Update Status
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
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

export default PayrollStatusModal;
