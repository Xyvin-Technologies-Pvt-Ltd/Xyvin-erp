import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraIcon, PencilIcon } from "@heroicons/react/24/outline";
import useAuthStore from "@/stores/auth.store";
import useHrmStore from "@/stores/useHrmStore";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const { getMyAttendance, updateProfile, getCurrentEmployee } = useHrmStore();

  const [currentUser, setCurrentUser] = useState(user);
  const [profilePicUrl, setProfilePicUrl] = useState("/assets/images/default-avatar.png");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0,
    leaveCount: 0,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    fetchUserData();
    fetchAttendanceStats();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await getCurrentEmployee();
      if (response?.data?.employee) {
        const userData = response.data.employee;

        setCurrentUser(userData);
        updateUser(userData);
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          emergencyContact: {
            name: userData.emergencyContact?.name || "",
            relationship: userData.emergencyContact?.relationship || "",
            phone: userData.emergencyContact?.phone || "",
            email: userData.emergencyContact?.email || "",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceStats();
  }, []);

  useEffect(() => {
    const picturePath = currentUser?.profilePicture;
    
    if (picturePath) {
      if (picturePath.startsWith("http")) {
        setProfilePicUrl(picturePath);
      } else {
        const cleanPath = picturePath.replace(/^\/+/, ""); // Remove leading slashes

      }

    } else {
      setProfilePicUrl("/assets/images/default-avatar.png");
    }
  }, [currentUser]);

  const fetchAttendanceStats = async () => {
    try {
      // Get the first day of the current month
      const startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      // Get the current date as end date
      const endDate = new Date();

      const response = await getMyAttendance(startDate, endDate);

      if (response?.data?.attendance) {
        const attendance = response.data.attendance;

        // Calculate different attendance types
        const presentDays = attendance.filter(
          (a) => a.status === "Present"
        ).length;
        const leaveDays = attendance.filter(
          (a) =>
            a.status === "On-Leave" ||
            (a.isLeave === true &&
              [
                "Annual",
                "Sick",
                "Personal",
                "Maternity",
                "Paternity",
                "Unpaid",
              ].includes(a.leaveType))
        ).length;
        const absentDays = attendance.filter(
          (a) => a.status === "Absent"
        ).length;
        const halfDays = attendance.filter(
          (a) => a.status === "Half-Day"
        ).length;
        const lateDays = attendance.filter((a) => a.status === "Late").length;
        const earlyLeaveDays = attendance.filter(
          (a) => a.status === "Early-Leave"
        ).length;

        // Calculate working days (excluding weekends and holidays)
        const workingDays = attendance.filter(
          (a) => !a.isHoliday && !a.isWeekend
        ).length;

        // Calculate effective present days (including half days as 0.5)
        const effectivePresentDays =
          presentDays + halfDays * 0.5 + lateDays + earlyLeaveDays;

        // Calculate attendance percentage based on working days (excluding leave days)
        const attendancePercentage =
          workingDays - leaveDays > 0
            ? Math.round(
                (effectivePresentDays / (workingDays - leaveDays)) * 100
              )
            : 0;

        setAttendanceStats({
          present: effectivePresentDays,
          absent: absentDays,
          total: workingDays,
          percentage: attendancePercentage,
          leaveCount: leaveDays,
        });

        console.log("Attendance Statistics:", {
          totalRecords: attendance.length,
          workingDays,
          presentDays,
          effectivePresentDays,
          leaveDays,
          absentDays,
          halfDays,
          lateDays,
          earlyLeaveDays,
          percentage: attendancePercentage,
          leaveDetails: attendance.filter(
            (a) => a.status === "On-Leave" || a.isLeave === true
          ),
        });
      } else {
        // If no attendance data available, keep default values
        setAttendanceStats({
          present: 0,
          absent: 0,
          total: 0,
          percentage: 0,
          leaveCount: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      toast.error("Failed to fetch attendance statistics");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("emergency")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await updateProfile(formData);

      // Log the entire response for debugging
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      console.log("Employee data:", response.data?.employee);

      if (!response.data?.employee) {
        throw new Error("No employee data received");
      }

      const updatedUser = response.data?.employee;
      updateUser(updatedUser);
      setCurrentUser(updatedUser);

      if (!updatedUser.profilePicture) {
        throw new Error("No profile picture URL received");
      }

      const picturePath = updatedUser.profilePicture;
    if (picturePath) {
      let newProfilePicUrl;
      if (picturePath.startsWith("http")) {
        newProfilePicUrl = picturePath;
      } else {
        const cleanPath = picturePath.replace(/^\/+/, "");
        newProfilePicUrl = `${import.meta.env.VITE_API_URL}/${cleanPath}`;
        newProfilePicUrl = `/${cleanPath}`;
      }
      console.log("Setting Profile Picture URL:", newProfilePicUrl);
      setProfilePicUrl(newProfilePicUrl);
    } else {
      console.warn("No profile picture path returned, using default avatar");
      setProfilePicUrl("/assets/images/default-avatar.png");
      toast.warn("Profile picture uploaded, but no URL returned. Using default avatar.");
    }

    toast.success("Profile picture updated successfully");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast.error(error.message || "Failed to update profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const response = await updateProfile(formData);
      if (response?.data?.user) {
        setCurrentUser(response.data.user);
        updateUser(response.data.user);
        toast.success("Profile updated successfully");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }




  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {/* <Button
          onClick={() => (isEditing ? handleSubmit() : setIsEditing(true))}
          variant="outline"
          className="flex items-center gap-2 transition-all hover:scale-105"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PencilIcon className="h-4 w-4" />
          )}
          {isEditing ? "Save Changes" : "Edit Profile"}
        </Button> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 overflow-hidden ring-4 ring-primary-50">
              <img
  src={profilePicUrl}
  alt="Profile"
  className="w-full h-full object-cover transition-transform group-hover:scale-110"
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "/assets/images/default-avatar.png";
  }}
/>
              </div>
              {/* <button
                onClick={handleImageClick}
                disabled={isUploading}
                className="absolute bottom-4 right-0 p-2 bg-primary-600 rounded-full text-black opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <CameraIcon className="h-4 w-4" />
              </button> */}
              {/* <input
                type="file"
                ref={formData.profilePicture}
                className="hidden"
                accept="image/*"
              /> */}
            </div>
            <h2 className="text-xl font-semibold">{`${
              currentUser?.firstName || ""
            } ${currentUser?.lastName || ""}`}</h2>
            <p className="text-gray-600">
              {currentUser?.position?.title || "No Position"}
            </p>
            <div className="mt-4 w-full">
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {attendanceStats.percentage}%
                  </p>
                  <p className="text-sm text-gray-500">Attendance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {attendanceStats.leaveCount}
                  </p>
                  <p className="text-sm text-gray-500">Leave Days</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="col-span-1 lg:col-span-2 p-6 hover:shadow-lg transition-all duration-300">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="transition-all focus:scale-[1.01]"
                  />
                ) : (
                  <p className="text-gray-900">{formData.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="transition-all focus:scale-[1.01]"
                  />
                ) : (
                  <p className="text-gray-900">{formData.lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="transition-all focus:scale-[1.01]"
                  />
                ) : (
                  <p className="text-gray-900">{formData.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="transition-all focus:scale-[1.01]"
                  />
                ) : (
                  <p className="text-gray-900">{formData.phone || "Not set"}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Department
                </label>
                <p className="text-gray-900">
                  {currentUser?.department?.name || "No Department"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Position
                </label>
                <p className="text-gray-900">
                  {currentUser?.position?.title || "No Position"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Employee ID
                </label>
                <p className="text-gray-900">
                  {currentUser?.employeeId || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Join Date
                </label>
                <p className="text-gray-900">
                  {currentUser?.joiningDate
                    ? new Date(currentUser.joiningDate).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Contact Name
                  </label>
                  {isEditing ? (
                    <Input
                      name="emergency.name"
                      value={formData.emergencyContact.name}
                      onChange={handleInputChange}
                      className="transition-all focus:scale-[1.01]"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.emergencyContact.name || "Not set"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Relationship
                  </label>
                  {isEditing ? (
                    <Input
                      name="emergency.relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={handleInputChange}
                      className="transition-all focus:scale-[1.01]"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.emergencyContact.relationship || "Not set"}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Contact Phone
                  </label>
                  {isEditing ? (
                    <Input
                      name="emergency.phone"
                      value={formData.emergencyContact.phone}
                      onChange={handleInputChange}
                      className="transition-all focus:scale-[1.01]"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.emergencyContact.phone || "Not set"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Contact Email
                  </label>
                  {isEditing ? (
                    <Input
                      name="emergency.email"
                      value={formData.emergencyContact.email}
                      onChange={handleInputChange}
                      className="transition-all focus:scale-[1.01]"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {formData.emergencyContact.email || "Not set"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
