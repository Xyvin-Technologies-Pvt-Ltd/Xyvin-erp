import { Fragment, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import useHrmStore from "../../../stores/useHrmStore";
import { Switch } from "@headlessui/react";

const MANAGER_ROLES = [
  "IT Manager",
  "Project Manager",
  "HR Manager",
  "Finance Manager",
  "Sales Manager",
];

const validationSchema = Yup.object({
  name: Yup.string().required("Department name is required"),
  code: Yup.string().required("Department code is required"),
  description: Yup.string().required("Description is required"),
  location: Yup.string().required("Location is required"),
  budget: Yup.number()
    .min(0, "Budget cannot be negative")
    .required("Budget is required"),
  manager: Yup.string(),
  isActive: Yup.boolean(),
});

const DepartmentModal = ({ department, onClose, onSuccess }) => {
  const { employees, fetchEmployees, createDepartment, updateDepartment, getNextDepartmentCode } = useHrmStore();

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        await fetchEmployees();
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toast.error("Failed to load employees");
      }
    };

    loadEmployees();
  }, [fetchEmployees]);

  // Filter employees to only show managers
  const managerEmployees = useMemo(() => {
    if (!Array.isArray(employees)) return [];
    return employees.filter(
      (emp) =>
        // Only show active employees with manager roles
        (emp.status === "active" || emp.isActive) &&
        MANAGER_ROLES.includes(emp.role)
    );
  }, [employees]);

  const formik = useFormik({
    initialValues: {
      name: department?.name || "",
      code: department?.code || "",
      description: department?.description || "",
      location: department?.location || "",
      budget: department?.budget || "",
      manager: department?.manager?._id || department?.manager?.id || "",
      isActive: department?.isActive ?? true,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        console.log("Submitting department form:", { department, values });

        if (department?.id || department?._id) {
          const departmentId = department.id || department._id;
          console.log("Updating department with ID:", departmentId);

          const updateData = {
            name: values.name,
            code: values.code,
            description: values.description,
            location: values.location,
            budget: Number(values.budget),
            manager: values.manager || null,
            isActive: values.isActive,
          };

          const updatedDepartment = await updateDepartment(
            departmentId,
            updateData
          );
          console.log("Department updated:", updatedDepartment);
          toast.success("Department updated successfully");
        } else {
          console.log("Creating new department");
          const createData = {
            ...values,
            budget: Number(values.budget),
            manager: values.manager || null,
          };

          const newDepartment = await createDepartment(createData);
          console.log("Department created:", newDepartment);
          toast.success("Department created successfully");
        }

        if (typeof onSuccess === "function") {
          onSuccess();
        }
        onClose();
      } catch (error) {
        console.error("Department operation failed:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong";
        toast.error(errorMessage);
      }
    },
  });

  // Add this useEffect to fetch and set the department code
  useEffect(() => {
    const fetchDepartmentCode = async () => {
      if (!department) {
        // Only fetch new code when creating new department
        try {
          const response = await getNextDepartmentCode();
          // Check the response structure and handle it appropriately
          const code = response?.data?.department?.code || response?.data?.code;
          if (code) {
            formik.setFieldValue("code", code);
          } else {
            throw new Error("Invalid response format");
          }
        } catch (error) {
          console.error("Error fetching department code:", error);
          toast.error("Failed to generate department code");
        }
      }
    };

    fetchDepartmentCode();
  }, [department]);

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
                      {department ? "Edit Department" : "Add Department"}
                    </Dialog.Title>

                    <form
                      onSubmit={formik.handleSubmit}
                      className="mt-6 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="label">
                            Department Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            className="input"
                            {...formik.getFieldProps("name")}
                          />
                          {formik.touched.name && formik.errors.name && (
                            <div className="error-message">
                              {formik.errors.name}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="code" className="label">
                            Department Code
                          </label>
                          <input
                            type="text"
                            id="code"
                            name="code"
                            className="input"
                            {...formik.getFieldProps("code")}
                            readOnly
                            disabled
                          />
                          {formik.touched.code && formik.errors.code && (
                            <div className="error-message">
                              {formik.errors.code}
                            </div>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label htmlFor="description" className="label">
                            Description
                          </label>
                          <textarea
                            id="description"
                            rows={3}
                            className="input"
                            {...formik.getFieldProps("description")}
                          />
                          {formik.touched.description &&
                            formik.errors.description && (
                              <div className="error-message">
                                {formik.errors.description}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="location" className="label">
                            Location
                          </label>
                          <input
                            type="text"
                            id="location"
                            className="input"
                            {...formik.getFieldProps("location")}
                          />
                          {formik.touched.location &&
                            formik.errors.location && (
                              <div className="error-message">
                                {formik.errors.location}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="budget" className="label">
                            Budget
                          </label>
                          <input
                            type="number"
                            id="budget"
                            className="input"
                            {...formik.getFieldProps("budget")}
                          />
                          {formik.touched.budget && formik.errors.budget && (
                            <div className="error-message">
                              {formik.errors.budget}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="manager" className="label">
                            Department Manager
                          </label>
                          <select
                            id="manager"
                            className="input"
                            {...formik.getFieldProps("manager")}
                          >
                            <option value="">Select Manager</option>
                            {managerEmployees.map((emp) => (
                              <option
                                key={emp.id || emp._id}
                                value={emp.id || emp._id}
                                title={`${emp.role} - ${
                                  emp.status || "Active"
                                }`}
                              >
                                {`${emp.firstName} ${emp.lastName} (${emp.role})`}
                              </option>
                            ))}
                          </select>
                          {formik.touched.manager && formik.errors.manager && (
                            <div className="error-message">
                              {formik.errors.manager}
                            </div>
                          )}
                          {managerEmployees.length === 0 && (
                            <div className="text-sm text-gray-500 mt-1">
                              No managers available. Please assign manager roles
                              to employees first.
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="isActive" className="label">
                            Status
                          </label>
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={formik.values.isActive}
                              onChange={(checked) => {
                                formik.setFieldValue("isActive", checked);
                              }}
                              className={`${
                                formik.values.isActive
                                  ? "bg-black"
                                  : "bg-gray-200"
                              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
                            >
                              <span className="sr-only">Enable status</span>
                              <span
                                className={`${
                                  formik.values.isActive
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                              />
                            </Switch>
                            <span className="text-sm text-gray-600">
                              {formik.values.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {formik.touched.isActive &&
                            formik.errors.isActive && (
                              <div className="error-message">
                                {formik.errors.isActive}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={formik.isSubmitting}
                          className={`inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto ${
                            formik.isSubmitting
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {formik.isSubmitting ? (
                            <div className="spinner border-2 h-5 w-5" />
                          ) : department ? (
                            "Update"
                          ) : (
                            "Create"
                          )}
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

export default DepartmentModal;
