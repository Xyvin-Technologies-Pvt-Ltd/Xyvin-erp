import { Fragment, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon, BuildingOfficeIcon, MapPinIcon, CurrencyDollarIcon, UserIcon, CodeBracketIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
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
  const isEditing = !!department;

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="inline-block transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
                  <BuildingOfficeIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isEditing ? 'Edit Department' : 'Create Department'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all duration-200"
                onClick={onClose}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white px-4 py-4">
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Department Name & Code */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700">
                    <BuildingOfficeIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                    Department Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...formik.getFieldProps("name")}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                      formik.touched.name && formik.errors.name
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                    }`}
                    placeholder="Enter department name..."
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      {formik.errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="code" className="flex items-center text-sm font-medium text-gray-700">
                    <CodeBracketIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                    Department Code *
                  </label>
                  <input
                    type="text"
                    id="code"
                    {...formik.getFieldProps("code")}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                    placeholder="Auto-generated..."
                  />
                  {formik.touched.code && formik.errors.code && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      {formik.errors.code}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700">
                  <DocumentTextIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={3}
                  {...formik.getFieldProps("description")}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none resize-none text-sm ${
                    formik.touched.description && formik.errors.description
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter department description..."
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="text-xs text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                    {formik.errors.description}
                  </p>
                )}
              </div>

              {/* Location & Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="location" className="flex items-center text-sm font-medium text-gray-700">
                    <MapPinIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    {...formik.getFieldProps("location")}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                      formik.touched.location && formik.errors.location
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                    }`}
                    placeholder="Enter location..."
                  />
                  {formik.touched.location && formik.errors.location && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      {formik.errors.location}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="budget" className="flex items-center text-sm font-medium text-gray-700">
                    <CurrencyDollarIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                    Budget *
                  </label>
                  <input
                    type="number"
                    id="budget"
                    {...formik.getFieldProps("budget")}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                      formik.touched.budget && formik.errors.budget
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                    }`}
                    placeholder="Enter budget amount..."
                  />
                  {formik.touched.budget && formik.errors.budget && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      {formik.errors.budget}
                    </p>
                  )}
                </div>
              </div>

              {/* Manager & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="manager" className="flex items-center text-sm font-medium text-gray-700">
                    <UserIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                    Department Manager
                  </label>
                  <div className="relative">
                    <select
                      id="manager"
                      {...formik.getFieldProps("manager")}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none appearance-none bg-white text-sm ${
                        formik.touched.manager && formik.errors.manager
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                      }`}
                    >
                      <option value="">Select Manager</option>
                      {managerEmployees.map((emp) => (
                        <option
                          key={emp.id || emp._id}
                          value={emp.id || emp._id}
                          title={`${emp.role} - ${emp.status || "Active"}`}
                        >
                          {`${emp.firstName} ${emp.lastName} (${emp.role})`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {formik.touched.manager && formik.errors.manager && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      {formik.errors.manager}
                    </p>
                  )}
                  {managerEmployees.length === 0 && (
                    <p className="text-xs text-gray-500 flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></span>
                      No managers available. Please assign manager roles to employees first.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="isActive" className="flex items-center text-sm font-medium text-gray-700">
                    <div className="w-3 h-3 mr-1.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                    Status
                  </label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Switch
                      checked={formik.values.isActive}
                      onChange={(checked) => {
                        formik.setFieldValue("isActive", checked);
                      }}
                      className={`${
                        formik.values.isActive
                          ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                          : "bg-gray-200"
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                    >
                      <span className="sr-only">Enable status</span>
                      <span
                        className={`${
                          formik.values.isActive
                            ? "translate-x-6"
                            : "translate-x-1"
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg`}
                      />
                    </Switch>
                    <span className={`text-sm font-medium ${
                      formik.values.isActive ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {formik.values.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {formik.touched.isActive && formik.errors.isActive && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      {formik.errors.isActive}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-sm"
                >
                  {formik.isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? 'Save Changes' : 'Create Department'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 text-sm"
                  onClick={onClose}
                  disabled={formik.isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentModal;