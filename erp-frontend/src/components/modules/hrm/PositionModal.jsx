import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { 
  XMarkIcon, 
  BriefcaseIcon, 
  BuildingOfficeIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  HashtagIcon,
  ListBulletIcon
} from "@heroicons/react/24/outline";
import { Switch } from "@headlessui/react";
import useHrmStore from "../../../stores/useHrmStore";

const PositionModal = ({ isOpen, onClose, position, onSuccess }) => {
  const { 
    departments, 
    fetchDepartments, 
    getNextPositionCode,
    createPosition,
    updatePosition 
  } = useHrmStore();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm();
  
  const selectedDepartment = watch("department");
  const isEditing = !!position;

  // Helper function for input styling
  const getInputClass = (hasError) => 
    `w-full px-4 py-3 rounded-lg border transition-all focus:outline-none text-sm ${
      hasError
        ? 'border-red-300 focus:border-red-500 bg-red-50'
        : 'border-gray-300 focus:border-blue-500 hover:border-gray-400'
    }`;

  // Helper component for error messages
  const ErrorMessage = ({ message }) => (
    <p className="text-xs text-red-600 flex items-center">
      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
      {message}
    </p>
  );

  // Helper component for form fields
  const FormField = ({ label, icon: Icon, error, children }) => (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-700">
        <Icon className="w-4 h-4 mr-2 text-gray-500" />
        {label}
      </label>
      {children}
      {error && <ErrorMessage message={error.message} />}
    </div>
  );

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (position) {
      const departmentId = typeof position.department === "object"
        ? position.department._id || position.department.id
        : position.department;

      setValue("title", position.title);
      setValue("code", position.code);
      setValue("description", position.description);
      setValue("department", departmentId);
      setValue("responsibilities", position.responsibilities?.join("\n"));
      setValue("requirements", position.requirements?.join("\n"));
      setValue("employmentType", position.employmentType);
      setValue("isActive", position.isActive);
      setValue("level", position.level || 1);
      setValue("maxPositions", position.maxPositions || 1);
    } else {
      reset({
        isActive: true,
        level: 1,
        maxPositions: 1,
        employmentType: "Full-time",
      });
    }
  }, [position, setValue, reset, departments]);

  useEffect(() => {
    const fetchPositionCode = async () => {
      if (!position) {
        try {
          const response = await getNextPositionCode();
          if (response?.data?.position?.code) {
            setValue("code", response.data.position.code);
          } else {
            throw new Error("Invalid position code received");
          }
        } catch (error) {
          console.error("Error fetching position code:", error);
          toast.error("Failed to generate position code. Please try again.");
        }
      }
    };
    fetchPositionCode();
  }, [position, setValue, getNextPositionCode]);

  const onSubmit = async (data) => {
    try {
      if (!data.department || !/^[0-9a-fA-F]{24}$/.test(data.department)) {
        throw new Error("Invalid department selected");
      }
      
      const selectedDept = departments.find(dept => dept.id === data.department);
      if (!selectedDept) {
        throw new Error("Selected department is not valid. Please select again.");
      }

      const formattedData = {
        ...data,
        department: selectedDept.id,
        responsibilities: data.responsibilities.split("\n").filter(item => item.trim()),
        requirements: data.requirements.split("\n").filter(item => item.trim()),
        level: parseInt(data.level),
        maxPositions: parseInt(data.maxPositions),
      };

      if (position) {
        await updatePosition(position.id, formattedData);
        toast.success("Position updated successfully");
      } else {
        await createPosition(formattedData);
        toast.success("Position created successfully");
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="inline-block transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <BriefcaseIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {isEditing ? 'Edit Position' : 'Create Position'}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {isEditing ? 'Update position details' : 'Add a new position to your organization'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white px-6 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title & Code */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Position Title *" icon={BriefcaseIcon} error={errors.title}>
                  <input
                    type="text"
                    {...register("title", { required: "Position title is required" })}
                    className={getInputClass(errors.title)}
                    placeholder="Enter position title..."
                  />
                </FormField>

                <FormField label="Position Code *" icon={CodeBracketIcon} error={errors.code}>
                  <input
                    type="text"
                    {...register("code")}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                    placeholder="Auto-generated..."
                  />
                </FormField>
              </div>

              {/* Department & Employment Type */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Department *" icon={BuildingOfficeIcon} error={errors.department}>
                  <div className="relative">
                    <select
                      {...register("department", { required: "Department is required" })}
                      className={`${getInputClass(errors.department)} appearance-none`}
                    >
                      <option value="">Select Department</option>
                      {departments?.map((dept) => (
                        <option key={dept.id || dept._id} value={dept.id || dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {selectedDepartment && (
                    <p className="text-xs text-blue-600 flex items-center">
                      <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                      Selected ID: {selectedDepartment}
                    </p>
                  )}
                </FormField>

                <FormField label="Employment Type *" icon={ClockIcon} error={errors.employmentType}>
                  <div className="relative">
                    <select
                      {...register("employmentType", { required: "Employment type is required" })}
                      className={`${getInputClass(errors.employmentType)} appearance-none`}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </FormField>
              </div>

              {/* Level & Max Positions */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Position Level *" icon={StarIcon} error={errors.level}>
                  <input
                    type="number"
                    min="1"
                    {...register("level", {
                      required: "Level is required",
                      min: { value: 1, message: "Level must be at least 1" },
                    })}
                    className={getInputClass(errors.level)}
                    placeholder="Enter position level..."
                  />
                </FormField>

                <FormField label="Max Positions *" icon={HashtagIcon} error={errors.maxPositions}>
                  <input
                    type="number"
                    min="1"
                    {...register("maxPositions", {
                      required: "Max positions is required",
                      min: { value: 1, message: "Max positions must be at least 1" },
                    })}
                    className={getInputClass(errors.maxPositions)}
                    placeholder="Enter max positions..."
                  />
                </FormField>
              </div>

              {/* Description */}
              <FormField label="Description *" icon={DocumentTextIcon} error={errors.description}>
                <textarea
                  rows={3}
                  {...register("description", { required: "Description is required" })}
                  className={`${getInputClass(errors.description)} resize-none`}
                  placeholder="Enter position description..."
                />
              </FormField>

              {/* Responsibilities & Requirements */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Responsibilities *" icon={ListBulletIcon} error={errors.responsibilities}>
                  <textarea
                    rows={4}
                    {...register("responsibilities", { required: "At least one responsibility is required" })}
                    className={`${getInputClass(errors.responsibilities)} resize-none`}
                    placeholder="Enter responsibilities (one per line)..."
                  />
                </FormField>

                <FormField label="Requirements *" icon={UserGroupIcon} error={errors.requirements}>
                  <textarea
                    rows={4}
                    {...register("requirements", { required: "At least one requirement is required" })}
                    className={`${getInputClass(errors.requirements)} resize-none`}
                    placeholder="Enter requirements (one per line)..."
                  />
                </FormField>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <div className="w-3 h-3 mr-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                  Status
                </label>
                <div className="flex items-center space-x-4 mt-3">
                  <Switch
                    checked={watch("isActive")}
                    onChange={(checked) => setValue("isActive", checked)}
                    className={`${
                      watch("isActive") ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-gray-200"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <span className="sr-only">Enable status</span>
                    <span
                      className={`${
                        watch("isActive") ? "translate-x-6" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-lg`}
                    />
                  </Switch>
                  <span className={`text-sm font-medium ${watch("isActive") ? 'text-green-600' : 'text-gray-500'}`}>
                    {watch("isActive") ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:shadow-sm transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-3"></div>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <BriefcaseIcon className="w-4 h-4 mr-2" />
                      {isEditing ? 'Save Changes' : 'Create Position'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-gray-50 text-sm"
                  onClick={onClose}
                  disabled={isSubmitting}
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

export default PositionModal;