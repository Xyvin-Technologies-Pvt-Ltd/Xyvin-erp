import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import useHrmStore from "../../../stores/useHrmStore";
import * as hrmService from "../../../api/hrm.service";

const validationSchema = Yup.object({
  employee: Yup.string().required("Employee is required"),
  period: Yup.string().required("Period is required"),
  basicSalary: Yup.number()
    .required("Basic salary is required")
    .min(0, "Basic salary cannot be negative"),
  allowances: Yup.object().shape({
    mobile: Yup.number().min(0, "Mobile allowance cannot be negative"),
    transport: Yup.number().min(0, "Transport allowance cannot be negative"),
    bonus: Yup.number().min(0, "Bonus cannot be negative"),
    other: Yup.number().min(0, "Other allowances cannot be negative"),
  }),
  deductions: Yup.object().shape({
    pf: Yup.number().min(0, "PF cannot be negative"),
    other: Yup.number().min(0, "Other deductions cannot be negative"),
  }),
});

const PayrollModal = ({ payroll, onClose, onSuccess }) => {
  const { employees, fetchEmployees } = useHrmStore();
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    // If editing existing payroll, set the selected employee
    if (payroll?.employee) {
      setSelectedEmployee(payroll.employee);
    }
  }, [payroll]);

  const formik = useFormik({
    initialValues: {
      employee: payroll?.employee?._id || "",
      period: payroll?.period ? new Date(payroll.period).toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7),
      basicSalary: payroll?.basicSalary || 0,
      allowances: {
        mobile: payroll?.allowances?.mobile || 0,
        transport: payroll?.allowances?.transport || 0,
        bonus: payroll?.allowances?.bonus || 0,
        other: payroll?.allowances?.other || 0,
      },
      deductions: {
        pf: payroll?.deductions?.pf || 0,
        other: payroll?.deductions?.other || 0,
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        console.log("Form values being submitted:", values);
        console.log("Period value:", values.period);
        
        if (payroll?._id) {
          await hrmService.updatePayroll(payroll._id, values);
          toast.success("Payroll updated successfully");
        } else {
          await hrmService.createPayroll(values);
          toast.success("Payroll created successfully");
        }
        onSuccess();
      } catch (error) {
        console.error("Error submitting payroll:", error);
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    },
  });

  const handleEmployeeChange = async (employeeId) => {
    try {
      formik.setFieldValue("employee", employeeId);

      if (employeeId) {
        // Find the selected employee from the employees list
        const employee = employees.find((emp) => emp.id === employeeId);
        if (employee) {
          setSelectedEmployee(employee);
          formik.setFieldValue("basicSalary", employee.salary);
        }
      } else {
        setSelectedEmployee(null);
        formik.setFieldValue("basicSalary", 0);
      }
    } catch (error) {
      toast.error("Error setting employee salary");
    }
  };

  const calculateTotal = () => {
    const basicSalary = Number(formik.values.basicSalary) || 0;
    const allowances = Object.values(formik.values.allowances).reduce(
      (sum, value) => sum + Number(value),
      0
    );
    const deductions = Object.values(formik.values.deductions).reduce(
      (sum, value) => sum + Number(value),
      0
    );
    return basicSalary + allowances - deductions;
  };

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
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      {payroll ? "Edit Payroll" : "Generate Payroll"}
                    </Dialog.Title>

                    <form
                      onSubmit={formik.handleSubmit}
                      className="mt-6 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label
                            htmlFor="employee"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Employee
                          </label>
                          <select
                            id="employee"
                            name="employee"
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            onChange={(e) =>
                              handleEmployeeChange(e.target.value)
                            }
                            value={formik.values.employee}
                          >
                            <option value="">Select Employee</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName} -{" "}
                                {emp.position?.title}
                              </option>
                            ))}
                          </select>
                          {formik.touched.employee &&
                            formik.errors.employee && (
                              <p className="mt-1 text-sm text-red-600">
                                {formik.errors.employee}
                              </p>
                            )}
                        </div>

                        <div>
                          <label
                            htmlFor="period"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Period
                          </label>
                          <input
                            type="month"
                            id="period"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            {...formik.getFieldProps("period")}
                            value={formik.values.period}
                            onChange={(e) => {
                              formik.setFieldValue("period", e.target.value);
                            }}
                          />
                          {formik.touched.period && formik.errors.period && (
                            <p className="mt-1 text-sm text-red-600">
                              {formik.errors.period}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="basicSalary"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Basic Salary
                          </label>
                          <input
                            type="number"
                            id="basicSalary"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            {...formik.getFieldProps("basicSalary")}
                            readOnly
                          />
                          {formik.touched.basicSalary &&
                            formik.errors.basicSalary && (
                              <p className="mt-1 text-sm text-red-600">
                                {formik.errors.basicSalary}
                              </p>
                            )}
                        </div>

                        <div className="col-span-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            Allowances
                          </h4>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="allowances.mobile"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Mobile
                              </label>
                              <input
                                type="number"
                                id="allowances.mobile"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                {...formik.getFieldProps("allowances.mobile")}
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="allowances.transport"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Transport
                              </label>
                              <input
                                type="number"
                                id="allowances.transport"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                {...formik.getFieldProps(
                                  "allowances.transport"
                                )}
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="allowances.bonus"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Bonus
                              </label>
                              <input
                                type="number"
                                id="allowances.bonus"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                {...formik.getFieldProps("allowances.bonus")}
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="allowances.other"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Other
                              </label>
                              <input
                                type="number"
                                id="allowances.other"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                {...formik.getFieldProps("allowances.other")}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            Deductions
                          </h4>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="deductions.pf"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Provident Fund (PF)
                              </label>
                              <input
                                type="number"
                                id="deductions.pf"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                {...formik.getFieldProps("deductions.pf")}
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="deductions.other"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Other
                              </label>
                              <input
                                type="number"
                                id="deductions.other"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                {...formik.getFieldProps("deductions.other")}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 mt-4 border-t border-gray-200 pt-4">
                          <div className="flex justify-between">
                            <span className="text-base font-medium text-gray-900">
                              Total Net Salary
                            </span>
                            <span className="text-base font-medium text-gray-900">
                              ₹{calculateTotal().toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                        >
                          {payroll ? "Update" : "Generate"} Payroll
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

export default PayrollModal;
