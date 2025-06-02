import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition, Switch } from "@headlessui/react";
import { XMarkIcon, ArrowDownTrayIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import useHrmStore from "../../../stores/useHrmStore";
import useAuthStore from "../../../stores/auth.store";
import api from "../../../api/api";

// Get the backend URL without the API path
const BACKEND_URL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:8080';

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

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];

// const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXVzZXIiPjxwYXRoIGQ9Ik0yMCA3LjVBNy41IDcuNSAwIDEgMSA1IDcuNWE3LjUgNy41IDAgMCAxIDE1IDBaIi8+PHBhdGggZD0iTTEyIDE1YTUgNSAwIDAgMC01IDV2Mi41aDEwVjIwYTUgNSAwIDAgMC01LTVaIi8+PC9zdmc+';

const DEFAULT_AVATAR = '/assets/images/default-avatar.png';

const validationSchema = Yup.object({
  employeeId: Yup.string().required("Employee ID is required"),
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().when(["isNewEmployee", "resetPassword"], {
    is: (isNewEmployee, resetPassword) => isNewEmployee || resetPassword,
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
  profilePicture: Yup.mixed().nullable(),
  proofType: Yup.string().nullable(),
  document: Yup.mixed().nullable(),
  emergencyContact: Yup.object().shape({
    name: Yup.string().nullable(),
    relationship: Yup.string().nullable(),
    phone: Yup.string().nullable(),
    email: Yup.string().email("Invalid email").nullable()
  }).nullable()
});

const EmployeeModal = ({ employee, onClose, onSuccess }) => {
  const { 
    departments, 
    positions, 
    fetchDepartments, 
    fetchPositions, 
    createEmployee, 
    updateEmployee, 
    getNextEmployeeId, 
    updateProfile,
    uploadEmployeeDocument,
    downloadDocument,
    deleteDocument,
    updateEmployeeProfilePicture
  } = useHrmStore();
  
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(DEFAULT_AVATAR);
  const [documentPreview, setDocumentPreview] = useState(employee?.documents || []);
  const [imageFile, setImageFile] = useState(null);
  const [document, setDocument] = useState(null);
  const [status, setStatus] = useState(employee?.status || "active");
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
    getValues
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      employeeId: employee?.employeeId || "",
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      email: employee?.email || "",
      password: "",
      phone: employee?.phone || "",
      department: employee?.department?._id || employee?.department || "",
      position: employee?.position?._id || employee?.position?.id || "",
      role: employee?.role || "Employee",
      joiningDate: employee?.joiningDate ? new Date(employee.joiningDate).toISOString().split("T")[0] : "",
      status: employee?.status || "active",
      salary: employee?.salary || "",
      emergencyContact: {
        name: employee?.emergencyContact?.name || "",
        relationship: employee?.emergencyContact?.relationship || "",
        phone: employee?.emergencyContact?.phone || "",
        email: employee?.emergencyContact?.email || ""
      },
      proofType: ""
    }
  });

  useEffect(() => {
    // Set emergency contact values
    if (employee?.emergencyContact) {
      console.log('Setting emergency contact values:', employee.emergencyContact);
      setValue('emergencyContact.name', employee.emergencyContact.name || '');
      setValue('emergencyContact.relationship', employee.emergencyContact.relationship || '');
      setValue('emergencyContact.phone', employee.emergencyContact.phone || '');
      setValue('emergencyContact.email', employee.emergencyContact.email || '');
    } else {
      console.log('No emergency contact data found in employee:', employee);
      // Initialize with empty values
      setValue('emergencyContact', {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      });
    }

    // Set document preview
    if (employee?.documents?.length > 0) {
      console.log('Setting document preview:', employee.documents);
      setDocumentPreview(employee.documents);
    }

    // Set profile picture
    if (employee?.profilePicture) {
      console.log('Original profile picture path:', employee.profilePicture);
      let profilePicPath = employee.profilePicture;
      
      // Remove any duplicate slashes and clean the path
      profilePicPath = profilePicPath
        .replace(/\/+/g, '/') // Replace multiple slashes with single slash
        .replace(/^\/public/, '') // Remove leading /public
        .replace(/^public/, ''); // Remove leading public without slash
      
      // Ensure the path starts with a slash
      if (!profilePicPath.startsWith('/')) {
        profilePicPath = '/' + profilePicPath;
      }

      // Add backend URL to the path
      const fullProfilePicUrl = `${BACKEND_URL}${profilePicPath}`;
      console.log('Full profile picture URL:', fullProfilePicUrl);
      setProfilePicUrl(fullProfilePicUrl);
    } else {
      console.log('No profile picture found, using default');
      setProfilePicUrl(DEFAULT_AVATAR);
    }
  }, [employee, setValue]);

  // Add effect to fetch departments and positions
  useEffect(() => {
    const loadDepartmentsAndPositions = async () => {
      try {
        console.log('Fetching departments and positions...');
        await fetchDepartments();
        await fetchPositions();
      } catch (error) {
        console.error('Error fetching departments and positions:', error);
        toast.error('Failed to load departments and positions');
      }
    };

    loadDepartmentsAndPositions();
  }, [fetchDepartments, fetchPositions]);

  // Add effect to handle password reset state
  useEffect(() => {
    if (showPasswordReset) {
      setValue('resetPassword', true);
    } else {
      setValue('resetPassword', false);
      setValue('password', '');
    }
  }, [showPasswordReset, setValue]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValue(name, value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG and GIF files are allowed.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should not exceed 5MB');
        return;
      }

      setImageFile(file);
      // Create a temporary preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfilePicUrl(previewUrl);
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected document:', file);
      console.log('Document type:', file.type);
      console.log('Document size:', file.size);

      const proofType = watch('proofType');
      if (!proofType) {
        toast.error('Please select a document type first');
        e.target.value = ''; // Reset the file input
        return;
      }

      // Validate file type and size
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only PDF, DOC, DOCX, JPEG and PNG files are allowed.');
        e.target.value = ''; // Reset the file input
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size should not exceed 5MB');
        e.target.value = ''; // Reset the file input
        return;
      }

      console.log('Document validation passed');
      console.log('Selected proof type:', proofType);

      setDocument({
        file: file,
        type: proofType
      });
    }
  };

  const handleEmergencyContactChange = (field, value) => {
    setValue(`emergencyContact.${field}`, value);
    console.log(`Emergency contact ${field} changed:`, value);
    console.log('Current form values:', getValues());
  };

  const handleDownloadDocument = async (doc) => {
    try {
      if (!employee?.id) {
        toast.error('Cannot download document: Missing employee information');
        return;
      }

      await downloadDocument(doc.url, doc.title, employee.id, doc._id);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document. Please try again.');
    }
  };

  const handleDeleteDocument = async (doc) => {
    try {
      if (!employee?.id || !doc._id) {
        toast.error('Cannot delete document: Missing information');
        return;
      }

      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to delete this document?')) {
        return;
      }

      await deleteDocument(employee.id, doc._id);
      toast.success('Document deleted successfully');
      
      // Update the document preview state
      setDocumentPreview(prev => prev.filter(d => d._id !== doc._id));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document. Please try again.');
    }
  };


  //   useEffect(() => {
  //   const fetchEmployeeId = async () => {
  //     if (!employee) {
  //       // Only fetch new ID when creating new employee
  //       try {
  //         console.log("Fetching next employee ID...");
  //         const response = await getNextEmployeeId();
  //         console.log("Response from getNextEmployeeId:", response);

  //         // Extract employeeId from the response
  //         const nextId = response?.data?.employee?.employeeId;
  //         console.log("Next ID extracted:", nextId);

  //         if (nextId) {
  //           formik.setFieldValue("employeeId", nextId);
  //         } else {
  //           console.error("Invalid response structure:", response);
  //           toast.error("Failed to generate employee ID. Please try again.");
  //         }
  //       } catch (error) {
  //         console.error("Error fetching employee ID:", error);
  //         toast.error(error.response?.data?.message || "Failed to generate employee ID");
  //       }
  //     }
  //   };

  //   fetchEmployeeId();
  // }, [employee, getNextEmployeeId]); // Add getNextEmployeeId to dependencies

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
            setValue("employeeId", nextId);
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
  }, [employee, getNextEmployeeId, setValue]); // Add setValue to dependencies

  const onSubmit = async (data, e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const employeeId = employee?.id || employee?._id;

      // Log all form data before sending
      console.log('Form submission data:', {
        ...data,
        password: data.password ? 'Password field is set' : 'No password',
        showPasswordReset,
        resetPassword: data.resetPassword
      });

      // Create the request data object
      const requestData = {
        ...data,
        emergencyContact: {
          name: data.emergencyContact?.name || '',
          relationship: data.emergencyContact?.relationship || '',
          phone: data.emergencyContact?.phone || '',
          email: data.emergencyContact?.email || ''
        }
      };

      // Log final request data without exposing password
      console.log('Final request data being sent to backend:', {
        ...requestData,
        password: requestData.password ? 'Password included' : 'No password',
        hasPassword: !!requestData.password,
        passwordLength: requestData.password?.length
      });

      // Create or update employee
      let response;
      if (employeeId) {
        console.log('Updating employee with ID:', employeeId);
        response = await updateEmployee(employeeId, requestData);
      } else {
        console.log('Creating new employee');
        response = await createEmployee(requestData);
      }

      // Handle profile picture upload for new employee
      if (response?.data?.employee?.id && imageFile) {
        const formData = new FormData();
        formData.append('profilePicture', imageFile);
        
        try {
          await updateEmployeeProfilePicture(response.data.employee.id, formData);
          console.log('Profile picture uploaded for new employee');
        } catch (error) {
          console.error('Error uploading profile picture for new employee:', error);
          toast.error('Employee created but failed to upload profile picture');
        }
      }

      // Handle document upload if there's a pending document
      if (document && (employeeId || response?.data?.employee?.id)) {
        const targetEmployeeId = employeeId || response?.data?.employee?.id;
        const formData = new FormData();
        formData.append('document', document.file);
        formData.append('type', document.type);

        try {
          console.log('Uploading document for employee:', targetEmployeeId);
          const docResponse = await uploadEmployeeDocument(targetEmployeeId, formData);
          console.log('Document upload response:', docResponse);
          
          if (docResponse?.data?.document) {
            setDocumentPreview(prev => [...prev, docResponse.data.document]);
            // toast.success('Document uploaded successfully');
          }
        } catch (error) {
          console.error('Error uploading document:', error);
          toast.error('Employee saved but failed to upload document');
        }
      }

      if (response) {
        toast.success(`Employee ${employee ? "updated" : "created"} successfully`);
        if (typeof onSuccess === "function") {
          onSuccess(response);
        }
        onClose();
      }

    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
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

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="employeeId" className="label">Employee ID</label>
                          <input
                            type="text"
                            id="employeeId"
                            className="input"
                            onChange={handleInputChange}
                            {...register("employeeId")}
                            readOnly
                            disabled
                          />
                          {errors.employeeId && (
                            <div className="error-message">{errors.employeeId.message}</div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="firstName" className="label">First Name</label>
                          <input
                            type="text"
                            id="firstName"
                            className="input"
                            {...register("firstName")}
                          />
                          {errors.firstName && (
                            <div className="error-message">{errors.firstName.message}</div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="lastName" className="label">Last Name</label>
                          <input
                            type="text"
                            id="lastName"
                            className="input"
                            {...register("lastName")}
                          />
                          {errors.lastName && (
                            <div className="error-message">{errors.lastName.message}</div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="email" className="label">Email</label>
                          <input
                            type="email"
                            id="email"
                            className="input"
                            {...register("email")}
                          />
                          {errors.email && (
                            <div className="error-message">{errors.email.message}</div>
                          )}
                        </div>

                        {!employee && (
                          <div>
                            <label htmlFor="password" className="label">Password</label>
                            <input
                              type="password"
                              id="password"
                              className="input"
                              {...register("password")}
                            />
                            {errors.password && (
                              <div className="error-message">{errors.password.message}</div>
                              )}
                          </div>
                        )}

                        <div>
                          <label htmlFor="phone" className="label">Phone Number</label>
                          <input
                            type="text"
                            id="phone"
                            className="input"
                            {...register("phone")}
                          />
                          {errors.phone && (
                            <div className="error-message">{errors.phone.message}</div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="role" className="label">Role</label>
                          <select
                            id="role"
                            className="input"
                            {...register("role")}
                          >
                            {EMPLOYEE_ROLES.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          {errors.role && (
                            <div className="error-message">{errors.role.message}</div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="department" className="label">Department</label>
                          <select
                            id="department"
                            className="input"
                            {...register("department")}
                          >
                            <option value="">Select Department</option>
                            {Array.isArray(departments) &&
                              departments.map((dept) => (
                                <option key={dept.id || dept._id} value={dept.id || dept._id}>
                                  {dept.name}
                                </option>
                              ))}
                          </select>
                          {errors.department && (
                            <div className="error-message">{errors.department.message}</div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="position" className="label">Position</label>
                          <select
                            id="position"
                            className="input"
                            {...register("position")}
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
                          {errors.position && (
                            <div className="error-message">{errors.position.message}</div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="joiningDate" className="label">Joining Date</label>
                          <input
                            type="date"
                            id="joiningDate"
                            className="input"
                            {...register("joiningDate")}
                          />
                          {errors.joiningDate && (
                            <div className="error-message">{errors.joiningDate.message}</div>
                            )}
                        </div>

                        <div>
                          <label htmlFor="status" className="label">Status</label>
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={status === "active"}
                              onChange={(checked) => {
                                setStatus(checked ? "active" : "inactive");
                                setValue("status", checked ? "active" : "inactive");
                              }}
                              className={`${
                                status === "active" ? "bg-black" : "bg-gray-200"
                              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
                            >
                              <span className="sr-only">Enable status</span>
                              <span
                                className={`${
                                  status === "active" ? "translate-x-6" : "translate-x-1"
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                              />
                            </Switch>
                            <span className="text-sm text-gray-600">
                              {status === "active" ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {errors.status && (
                            <div className="error-message">{errors.status.message}</div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="salary" className="label">Salary</label>
                          <input
                            type="number"
                            id="salary"
                            className="input"
                            {...register("salary")}
                          />
                          {errors.salary && (
                            <div className="error-message">{errors.salary.message}</div>
                          )}
                        </div>

                        {/* Password Reset Section - Moved here */}
                        {employee && (
                          <div>
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id="resetPassword"
                                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                checked={showPasswordReset}
                                onChange={(e) => setShowPasswordReset(e.target.checked)}
                              />
                              <label htmlFor="resetPassword" className="ml-2 text-sm text-gray-700">
                                Reset Password
                              </label>
                            </div>
                            
                            {showPasswordReset && (
                              <div className="mt-2">
                                <label htmlFor="password" className="label">New Password</label>
                                <input
                                  type="password"
                                  id="password"
                                  className="input"
                                  {...register("password", {
                                    onChange: (e) => {
                                      console.log('Password field changed:', {
                                        hasValue: !!e.target.value,
                                        length: e.target.value.length
                                      });
                                    }
                                  })}
                                  placeholder="Enter new password"
                                />
                                {errors.password && (
                                  <div className="error-message">{errors.password.message}</div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  Password must be at least 6 characters long
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 w-[60%]">
                          <div>
                            <label htmlFor="profilePicture" className="label">Profile Picture</label>
                            <div className="space-y-4">
                              {profilePicUrl && (
                                <div className="flex items-center space-x-4">
                                  <img
                                    src={profilePicUrl}
                                    alt="Profile Preview"
                                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-200 bg-gray-100"
                                    onError={(e) => {
                                      console.error('Error loading profile picture from URL:', profilePicUrl);
                                      // Only set default if not already using default and not a blob URL
                                      if (profilePicUrl !== DEFAULT_AVATAR && !profilePicUrl.startsWith('blob:')) {
                                        console.log('Setting default avatar');
                                        setProfilePicUrl(DEFAULT_AVATAR);
                                      }
                                      // Prevent further error handling
                                      e.target.onerror = null;
                                    }}
                                  />
                                  <div className="text-sm text-gray-500">
                                    {profilePicUrl === DEFAULT_AVATAR 
                                      ? "No profile picture uploaded" 
                                      : (
                                        <div>
                                          <p>Current profile picture</p>
                                          <p className="text-xs text-gray-400 mt-1">
                                            {profilePicUrl.split('/').pop()}
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              )}
                              <input
                                type="file"
                                id="profilePicture"
                                accept="image/*"
                                className="input"
                                onChange={handleFileChange}
                              />
                              <p className="text-xs text-gray-500">
                                Supported formats: JPEG, PNG, GIF (Max 5MB)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <div className="col-span-2">
                            <label htmlFor="proofType" className="label">Document Type</label>
                            <select
                              id="proofType"
                              className="input"
                              {...register("proofType")}
                            >
                              <option value="">Select Document Type</option>
                             
                              <option value="aadhaar">Aadhaar</option>
                              <option value="pan">PAN Card</option>
                              <option value="passport">Passport</option>


                            </select>
                          </div>

                          <div className="col-span-2">
                            <label htmlFor="proofDocument" className="label">Upload Document</label>
                            <input
                              type="file"
                              id="proofDocument"
                              className="input"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={handleDocumentChange}
                            />
                            {/* <p className="text-xs text-gray-500 mt-1">
                              Please select a document type before uploading a file. Supported formats: PDF, DOC, DOCX, JPEG, PNG (Max 5MB)
                            </p> */}
                          </div>

                          {documentPreview && documentPreview.length > 0 && (
                            <div className="col-span-2 mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Existing Documents</h4>
                              <div className="space-y-2">
                                {documentPreview.map((doc, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex-grow">
                                      <p className="text-sm font-medium text-gray-900">
                                        {doc.type.charAt(0).toUpperCase() + doc.type.slice(1).replace('_', ' ')}
                                      </p>
                                      <p className="text-xs text-gray-500">{doc.title}</p>
                                      {doc.uploadedAt && (
                                        <p className="text-xs text-gray-400">
                                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadDocument(doc)}
                                        className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                                        title="Download Document"
                                      >
                                        <ArrowDownTrayIcon className="h-5 w-5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDocument(doc)}
                                        className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                                        title="Delete Document"
                                      >
                                        <TrashIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 mt-6 pt-6 border-t">
                          <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="emergencyContact.name" className="label">Contact Name</label>
                              <input
                                type="text"
                                id="emergencyContact.name"
                                className="input"
                                {...register("emergencyContact.name")}
                                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="emergencyContact.relationship" className="label">Relationship</label>
                              <input
                                type="text"
                                id="emergencyContact.relationship"
                                className="input"
                                {...register("emergencyContact.relationship")}
                                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="emergencyContact.phone" className="label">Contact Phone</label>
                              <input
                                type="text"
                                id="emergencyContact.phone"
                                className="input"
                                {...register("emergencyContact.phone")}
                                onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="emergencyContact.email" className="label">Contact Email</label>
                              <input
                                type="email"
                                id="emergencyContact.email"
                                className="input"
                                {...register("emergencyContact.email")}
                                onChange={(e) => handleEmergencyContactChange('email', e.target.value)}
                              />
                            </div>
                          </div>
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
                          {isLoading ? "Processing..." : employee ? "Update" : "Create"}
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
