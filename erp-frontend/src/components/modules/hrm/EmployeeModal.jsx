import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition, Switch } from "@headlessui/react";
import { XMarkIcon, ArrowDownTrayIcon, TrashIcon, UserIcon, CodeBracketIcon, EnvelopeIcon, PhoneIcon, UserGroupIcon, BuildingOfficeIcon, BriefcaseIcon, CalendarIcon, CurrencyDollarIcon, LockClosedIcon, PhotographIcon, CameraIcon, CloudArrowUpIcon, DocumentIcon, DocumentArrowUpIcon, HeartIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
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
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {employee ? "Edit Employee" : "Add Employee"}
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

                <div className="bg-white px-4 py-4">
                  <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="employeeId" className="flex items-center text-sm font-medium text-gray-700">
                          <CodeBracketIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Employee ID
                        </label>
                        <input
                          type="text"
                          id="employeeId"
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                          onChange={handleInputChange}
                          {...register("employeeId")}
                          readOnly
                          disabled
                        />
                        {errors.employeeId && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.employeeId.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="firstName" className="flex items-center text-sm font-medium text-gray-700">
                          <UserIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                          {...register("firstName")}
                        />
                        {errors.firstName && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="lastName" className="flex items-center text-sm font-medium text-gray-700">
                          <UserIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                          {...register("lastName")}
                        />
                        {errors.lastName && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
                          <EnvelopeIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.email.message}
                          </p>
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

                      <div className="space-y-1">
                        <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700">
                          <PhoneIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Phone Number
                        </label>
                        <input
                          type="text"
                          id="phone"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                          {...register("phone")}
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="role" className="flex items-center text-sm font-medium text-gray-700">
                          <UserGroupIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Role
                        </label>
                        <select
                          id="role"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                          {...register("role")}
                        >
                          {EMPLOYEE_ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        {errors.role && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.role.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="department" className="flex items-center text-sm font-medium text-gray-700">
                          <BuildingOfficeIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Department
                        </label>
                        <select
                          id="department"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
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
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.department.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="position" className="flex items-center text-sm font-medium text-gray-700">
                          <BriefcaseIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Position
                        </label>
                        <select
                          id="position"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
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
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.position.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="joiningDate" className="flex items-center text-sm font-medium text-gray-700">
                          <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Joining Date
                        </label>
                        <input
                          type="date"
                          id="joiningDate"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                          {...register("joiningDate")}
                        />
                        {errors.joiningDate && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.joiningDate.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="status" className="flex items-center text-sm font-medium text-gray-700">
                          <div className="w-3 h-3 mr-1.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                          Status
                        </label>
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={status === "active"}
                            onChange={(checked) => {
                              setStatus(checked ? "active" : "inactive");
                              setValue("status", checked ? "active" : "inactive");
                            }}
                            className={`${
                              status === "active"
                                ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                                : "bg-gray-200"
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                          >
                            <span className="sr-only">Enable status</span>
                            <span
                              className={`${
                                status === "active" ? "translate-x-6" : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg`}
                            />
                          </Switch>
                          <span className={`text-sm font-medium ${
                            status === "active" ? "text-green-600" : "text-gray-500"
                          }`}>
                            {status === "active" ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {errors.status && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.status.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="salary" className="flex items-center text-sm font-medium text-gray-700">
                          <CurrencyDollarIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                          Salary
                        </label>
                        <input
                          type="number"
                          id="salary"
                          className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                          {...register("salary")}
                        />
                        {errors.salary && (
                          <p className="text-xs text-red-600 flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                            {errors.salary.message}
                          </p>
                        )}
                      </div>

                      {/* Password Reset Section with updated styling */}
                      {employee && (
                        <div className="space-y-1">
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id="resetPassword"
                              className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                              checked={showPasswordReset}
                              onChange={(e) => setShowPasswordReset(e.target.checked)}
                            />
                            <label htmlFor="resetPassword" className="ml-2 text-sm text-gray-700">
                              Reset Password
                            </label>
                          </div>
                          
                          {showPasswordReset && (
                            <div className="mt-2">
                              <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700">
                                <LockClosedIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                                New Password
                              </label>
                              <input
                                type="password"
                                id="password"
                                className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                                {...register("password")}
                                placeholder="Enter new password"
                              />
                              {errors.password && (
                                <p className="text-xs text-red-600 flex items-center">
                                  <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                                  {errors.password.message}
                                </p>
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
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center text-sm font-medium text-gray-700">
                                <PhotographIcon className="w-4 h-4 mr-1.5 text-purple-500" />
                                Profile Picture
                              </label>
                              {profilePicUrl !== DEFAULT_AVATAR && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProfilePicUrl(DEFAULT_AVATAR);
                                    setImageFile(null);
                                  }}
                                  className="text-xs text-red-500 hover:text-red-600 flex items-center"
                                >
                                  <TrashIcon className="w-3 h-3 mr-1" />
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="flex flex-col items-center space-y-4">
                              <div className="relative group">
                                <img
                                  src={profilePicUrl}
                                  alt="Profile Preview"
                                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg transition-transform duration-200 group-hover:scale-105"
                                  onError={(e) => {
                                    console.error('Error loading profile picture from URL:', profilePicUrl);
                                    if (profilePicUrl !== DEFAULT_AVATAR && !profilePicUrl.startsWith('blob:')) {
                                      console.log('Setting default avatar');
                                      setProfilePicUrl(DEFAULT_AVATAR);
                                    }
                                    e.target.onerror = null;
                                  }}
                                />
                                <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                  <CameraIcon className="h-8 w-8 text-white opacity-75" />
                                </div>
                              </div>

                              <div className="w-full">
                                <div className="flex flex-col items-center">
                                  <label
                                    htmlFor="profilePicture"
                                    className="w-full flex flex-col items-center px-4 py-6 bg-gradient-to-br from-white to-purple-50 text-purple-600 rounded-lg border-2 border-purple-100 border-dashed cursor-pointer hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 hover:border-purple-300 hover:text-purple-700 transition-all duration-200 group"
                                  >
                                    <CloudArrowUpIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform duration-200" />
                                    <span className="text-sm font-medium">Click to upload</span>
                                    <input
                                      type="file"
                                      id="profilePicture"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={handleFileChange}
                                    />
                                  </label>
                                  <p className="mt-2 text-xs text-gray-500">
                                    Supported formats: JPEG, PNG, GIF (Max 5MB)
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center text-sm font-medium text-gray-700">
                              <DocumentIcon className="w-4 h-4 mr-1.5 text-purple-500" />
                              Document Upload
                            </label>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <select
                                id="proofType"
                                className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400 bg-white"
                                {...register("proofType")}
                              >
                                <option value="">Select Document Type</option>
                                <option value="aadhaar">Aadhaar</option>
                                <option value="pan">PAN Card</option>
                                <option value="passport">Passport</option>
                              </select>
                            </div>

                            <div>
                              <label
                                htmlFor="proofDocument"
                                className="w-full flex flex-col items-center px-4 py-6 bg-gradient-to-br from-white to-purple-50 text-purple-600 rounded-lg border-2 border-purple-100 border-dashed cursor-pointer hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 hover:border-purple-300 hover:text-purple-700 transition-all duration-200 group"
                              >
                                <DocumentArrowUpIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform duration-200" />
                                <span className="text-sm font-medium">Click to upload document</span>
                                <input
                                  type="file"
                                  id="proofDocument"
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  onChange={handleDocumentChange}
                                />
                              </label>
                              <p className="mt-2 text-xs text-gray-500 text-center">
                                Supported formats: PDF, DOC, DOCX, JPEG, PNG (Max 5MB)
                              </p>
                            </div>
                          </div>
                        </div>

                        {documentPreview && documentPreview.length > 0 && (
                          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="flex items-center text-sm font-medium text-gray-900">
                                <DocumentDuplicateIcon className="w-4 h-4 mr-1.5 text-purple-500" />
                                Uploaded Documents
                              </h4>
                              <span className="text-xs text-gray-500">
                                {documentPreview.length} document{documentPreview.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {documentPreview.map((doc, index) => (
                                <div 
                                  key={index} 
                                  className="flex items-center justify-between p-3 bg-gradient-to-br from-white to-purple-50 rounded-lg border border-purple-100 hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 transition-all duration-200"
                                >
                                  <div className="flex-grow min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {doc.type.charAt(0).toUpperCase() + doc.type.slice(1).replace('_', ' ')}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{doc.title}</p>
                                    {doc.uploadedAt && (
                                      <p className="text-xs text-gray-400">
                                        {new Date(doc.uploadedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadDocument(doc)}
                                      className="p-1.5 text-purple-600 hover:text-purple-700 rounded-lg hover:bg-purple-200/50 transition-all duration-200"
                                      title="Download Document"
                                    >
                                      <ArrowDownTrayIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDocument(doc)}
                                      className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-100 transition-all duration-200"
                                      title="Delete Document"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 mt-6 pt-6 border-t">
                        <div className="flex items-center space-x-2 mb-4">
                          <PhoneIcon className="w-5 h-5 text-purple-500" />
                          <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label htmlFor="emergencyContact.name" className="flex items-center text-sm font-medium text-gray-700">
                              <UserIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                              Contact Name
                            </label>
                            <input
                              type="text"
                              id="emergencyContact.name"
                              className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                              {...register("emergencyContact.name")}
                              onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label htmlFor="emergencyContact.relationship" className="flex items-center text-sm font-medium text-gray-700">
                              <HeartIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                              Relationship
                            </label>
                            <input
                              type="text"
                              id="emergencyContact.relationship"
                              className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                              {...register("emergencyContact.relationship")}
                              onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label htmlFor="emergencyContact.phone" className="flex items-center text-sm font-medium text-gray-700">
                              <PhoneIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                              Contact Phone
                            </label>
                            <input
                              type="text"
                              id="emergencyContact.phone"
                              className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
                              {...register("emergencyContact.phone")}
                              onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label htmlFor="emergencyContact.email" className="flex items-center text-sm font-medium text-gray-700">
                              <EnvelopeIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                              Contact Email
                            </label>
                            <input
                              type="email"
                              id="emergencyContact.email"
                              className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm border-gray-300 focus:border-purple-500 hover:border-gray-400"
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
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-sm"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            {employee ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          employee ? "Save Changes" : "Create Employee"
                        )}
                      </button>
                      <button
                        type="button"
                        className="mt-3 sm:mt-0 sm:mr-3 px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 text-sm"
                        onClick={onClose}
                        disabled={isLoading}
                      >
                        Cancel
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

export default EmployeeModal;
