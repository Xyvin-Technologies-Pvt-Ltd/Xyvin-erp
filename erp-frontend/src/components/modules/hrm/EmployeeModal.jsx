import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition, Switch } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import useHrmStore from "../../../stores/useHrmStore";
import useAuthStore from "../../../stores/auth.store";

const EMPLOYEE_ROLES = [
  "ERP System Administrator",
  "IT Manager",
  "Project Manager",
  "HR Manager",
  "Finance Manager",
  "Employee",
  "Sales Manager",
  "Admin"
];

const validationSchema = Yup.object({
  employeeId: Yup.string().required("Employee ID is required"),
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().when("isNewEmployee", {
    is: true,
    then: () =>
      Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
    otherwise: () => Yup.string(),
  }),
  phone: Yup.string().required("Phone number is required"),
  department: Yup.string().required("Department is required"),
  position: Yup.mixed().required("Position is required"),
  role: Yup.string().required("Role is required"),
  joiningDate: Yup.date().required("Joining date is required"),
  status: Yup.string().required("Status is required"),
  salary: Yup.number()
    .min(0, "Salary cannot be negative")
    .required("Salary is required"),
});

const EmployeeModal = ({ employee, onClose, onSuccess }) => {
  const { departments, positions, fetchDepartments, fetchPositions, createEmployee, updateEmployee, getNextEmployeeId  } =
    useHrmStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize formik first
  const formik = useFormik({
    initialValues: {
      employeeId: employee?.employeeId || "",
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      email: employee?.email || "",
      password: "",
      isNewEmployee: !employee,
      phone: employee?.phone || "",
      department: employee?.department?._id || employee?.department || "",
      position:
        employee?.position?._id ||
        employee?.position?.id ||
        (typeof employee?.position === "string" ? employee.position : ""),
      role: employee?.role || "Employee",
      joiningDate: employee?.joiningDate
        ? new Date(employee.joiningDate).toISOString().split("T")[0]
        : "",
      status: employee?.status || "active",
      salary: employee?.salary || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        console.log("Form submitted with values:", values);
        setIsLoading(true);

        // Get user from auth store
        const authUser = useAuthStore.getState().user;
        if (!authUser?._id && !authUser?.id) {
          toast.error("Authentication required. Please log in again.");
          return;
        }

        // Create form data with position ID
        const formData = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          department: values.department,
          position: values.position,
          role: values.role,
          joiningDate: values.joiningDate,
          status: values.status || "active",
          salary: Number(values.salary),
          createdBy: authUser._id || authUser.id // Add the user ID here
        };

        console.log("Sending form data:", formData);

        if (!employee?.id && !employee?._id) {
          formData.employeeId = values.employeeId;
          formData.password = values.password;
        }

        let response;
        if (employee?.id || employee?._id) {
          const employeeId = employee.id || employee._id;
          console.log("🆔 Employee ID for update:", employeeId);
          console.log("🆔 ID type:", typeof employeeId);
          
          try {
            console.log("📡 Calling updateEmployee...");
            response = await updateEmployee(employeeId, formData);
            console.log("✅ Update successful:", response);
          } catch (updateError) {
            console.error("❌ Update error:", updateError);
            console.error("Response details:", updateError.response?.data);
            throw updateError;
          }
        } else {
          response = await createEmployee(formData);
        }

        if (response) {
          toast.success(
            `Employee ${employee ? "updated" : "created"} successfully`
          );
          if (typeof onSuccess === "function") {
            onSuccess(response);
          }
          onClose();
        }
      } catch (error) {
        console.error("Form submission error:", error);
        console.error("Error details:", error.response?.data);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Something went wrong"
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Fetching departments and positions...');
        await Promise.all([fetchDepartments(), fetchPositions()]);
        console.log('Departments after fetch:', departments);
        console.log('Positions after fetch:', positions);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load departments and positions');
      }
    };

    loadData();
  }, [fetchDepartments, fetchPositions]);

  useEffect(() => {
    const fetchEmployeeId = async () => {
      if (!employee) {
        // Only fetch new ID when creating new employee
        try {
          console.log("Fetching next employee ID...");
          const response = await getNextEmployeeId();
          console.log("Response from getNextEmployeeId:", response);

          // Extract employeeId from the response
          const nextId = response?.data?.employee?.employeeId;
          console.log("Next ID extracted:", nextId);

          if (nextId) {
            formik.setFieldValue("employeeId", nextId);
          } else {
            console.error("Invalid response structure:", response);
            toast.error("Failed to generate employee ID. Please try again.");
          }
        } catch (error) {
          console.error("Error fetching employee ID:", error);
          toast.error(error.response?.data?.message || "Failed to generate employee ID");
        }
      }
    };

    fetchEmployeeId();
  }, [employee, getNextEmployeeId]); // Add getNextEmployeeId to dependencies

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted, calling formik.handleSubmit");
    console.log("Current form values:", formik.values);

    // Validate form before submission
    const errors = await formik.validateForm();
    if (Object.keys(errors).length === 0) {
      formik.handleSubmit(e);
    } else {
      console.error("Form validation errors:", errors);
      // Show all validation errors to the user
      const errorMessages = Object.values(errors).join(", ");
      toast.error(`Please fix the following errors: ${errorMessages}`);
    }
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
                      {employee ? "Edit Employee" : "Add Employee"}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="employeeId" className="label">
                            Employee ID
                          </label>
                          <input
                            type="text"
                            id="employeeId"
                            name="employeeId"
                            className="input"
                            {...formik.getFieldProps("employeeId")}
                            readOnly
                            disabled
                          />
                          {formik.touched.employeeId &&
                            formik.errors.employeeId && (
                              <div className="error-message">
                                {formik.errors.employeeId}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="firstName" className="label">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            className="input"
                            {...formik.getFieldProps("firstName")}
                          />
                          {formik.touched.firstName &&
                            formik.errors.firstName && (
                              <div className="error-message">
                                {formik.errors.firstName}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="lastName" className="label">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            className="input"
                            {...formik.getFieldProps("lastName")}
                          />
                          {formik.touched.lastName &&
                            formik.errors.lastName && (
                              <div className="error-message">
                                {formik.errors.lastName}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="email" className="label">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            className="input"
                            {...formik.getFieldProps("email")}
                          />
                          {formik.touched.email && formik.errors.email && (
                            <div className="error-message">
                              {formik.errors.email}
                            </div>
                          )}
                        </div>

                        {!employee && (
                          <div>
                            <label htmlFor="password" className="label">
                              Password
                            </label>
                            <input
                              type="password"
                              id="password"
                              name="password"
                              className="input"
                              {...formik.getFieldProps("password")}
                            />
                            {formik.touched.password &&
                              formik.errors.password && (
                                <div className="error-message">
                                  {formik.errors.password}
                                </div>
                              )}
                          </div>
                        )}

                        <div>
                          <label htmlFor="phone" className="label">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            id="phone"
                            name="phone"
                            className="input"
                            {...formik.getFieldProps("phone")}
                          />
                          {formik.touched.phone && formik.errors.phone && (
                            <div className="error-message">
                              {formik.errors.phone}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="role" className="label">
                            Role
                          </label>
                          <select
                            id="role"
                            name="role"
                            className="input"
                            {...formik.getFieldProps("role")}
                          >
                            {EMPLOYEE_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          {formik.touched.role && formik.errors.role && (
                            <div className="error-message">
                              {formik.errors.role}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="department" className="label">
                            Department
                          </label>
                          <select
                            id="department"
                            name="department"
                            className="input"
                            {...formik.getFieldProps("department")}
                          >
                            <option value="">Select Department</option>
                            {Array.isArray(departments) &&
                              departments.map((dept) => (
                                <option
                                  key={dept.id || dept._id}
                                  value={dept.id || dept._id}
                                >
                                  {dept.name}
                                </option>
                              ))}
                          </select>
                          {formik.touched.department &&
                            formik.errors.department && (
                              <div className="error-message">
                                {formik.errors.department}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="position" className="label">
                            Position
                          </label>
                          <select
                            id="position"
                            name="position"
                            className="input"
                            value={formik.values.position || ""}
                            onChange={(e) => {
                              formik.setFieldValue("position", e.target.value);
                            }}
                            onBlur={formik.handleBlur}
                          >
                            <option value="">Select Position</option>
                            {Array.isArray(positions) && positions.map((position) => {
                              const positionId = position._id || position.id;
                              return (
                                <option key={positionId} value={positionId}>
                                  {position.title}
                                </option>
                              );
                            })}
                          </select>
                          {formik.touched.position &&
                            formik.errors.position && (
                              <div className="error-message">
                                {formik.errors.position}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="joiningDate" className="label">
                            Joining Date
                          </label>
                          <input
                            type="date"
                            id="joiningDate"
                            name="joiningDate"
                            className="input"
                            {...formik.getFieldProps("joiningDate")}
                          />
                          {formik.touched.joiningDate &&
                            formik.errors.joiningDate && (
                              <div className="error-message">
                                {formik.errors.joiningDate}
                              </div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="status" className="label">
                            Status
                          </label>
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={formik.values.status === "active"}
                              onChange={(checked) => {
                                formik.setFieldValue(
                                  "status",
                                  checked ? "active" : "inactive"
                                );
                              }}
                              className={`${
                                formik.values.status === "active"
                                  ? "bg-black"
                                  : "bg-gray-200"
                              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
                            >
                              <span className="sr-only">Enable status</span>
                              <span
                                className={`${
                                  formik.values.status === "active"
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                              />
                            </Switch>
                            <span className="text-sm text-gray-600">
                              {formik.values.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                          {formik.touched.status && formik.errors.status && (
                            <div className="error-message">
                              {formik.errors.status}
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="salary" className="label">
                            Salary
                          </label>
                          <input
                            type="number"
                            id="salary"
                            name="salary"
                            className="input"
                            {...formik.getFieldProps("salary")}
                          />
                          {formik.touched.salary && formik.errors.salary && (
                            <div className="error-message">
                              {formik.errors.salary}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 sm:ml-3 sm:w-auto ${
                            isLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {isLoading
                            ? "Processing..."
                            : employee
                            ? "Update"
                            : "Create"}
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

export default EmployeeModal;
