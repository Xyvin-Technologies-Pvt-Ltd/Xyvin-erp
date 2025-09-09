import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  IdentificationIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "@/stores/auth.store";
import useHrmStore from "@/stores/useHrmStore";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "@/api/api";

// Get the backend URL without the API path
const BACKEND_URL =
  api.defaults.baseURL?.replace("/api/v1", "") || "http://localhost:8080";
const DUMMY_SVG = `data:image/svg+xml;utf8,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'  fill='%23CBD5E1'>
    <circle cx='16' cy='10' r='6'/>
    <path d='M4 28c0-6.6 8-10 12-10s12 3.4 12 10v2H4v-2z'/>
  </svg>`;

const Profile = () => {
  const { user } = useAuthStore();
  const { getMyAttendance, getCurrentEmployee, updateProfile } = useHrmStore();

  const [currentUser, setCurrentUser] = useState(user);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0,
    leaveCount: 0,
  });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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

        // Handle profile picture URL
        if (userData.profilePicture) {
          let picturePath = userData.profilePicture;

          // If it's a full URL, use it as is
          if (picturePath.startsWith("http")) {
            setProfilePicUrl(picturePath);
          } else {
            // Clean up the path and construct the full URL
            picturePath = picturePath
              .replace(/^\/public/, "")
              .replace(/^public/, "")
              .replace(/\/+/g, "/");

            if (!picturePath.startsWith("/")) {
              picturePath = "/" + picturePath;
            }

            setProfilePicUrl(`${BACKEND_URL}${picturePath}`);
          }
        } else {
          setProfilePicUrl(DUMMY_SVG); // fallback if no picture
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      // Get the first day of the current month
      // const startDate = new Date();
      // startDate.setDate(1);
      // startDate.setHours(0, 0, 0, 0);

      // // Get the current date as end date
      // const endDate = new Date();
      const now = new Date();

      // start of this month
      const startDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)
      );

      // end of this month
      const endDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999
        )
      );
      const response = await getMyAttendance({ startDate, endDate });
      console.log(response);
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
                "Halfday",
                "Emergency",
                "Unpaid",
              ].includes(a.leaveType))
        ).length;
        const absentDays = attendance.filter(
          (a) => a.status === "Absent"
        ).length;
        const halfDays = attendance.filter(
          (a) => a.status === "Halfday"
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
        // const attendancePercentage =
        //   workingDays - leaveDays > 0
        //     ? Math.round(
        //         (effectivePresentDays / (workingDays - leaveDays)) * 100
        //       )
        //     : 0;
        const attendancePercentage =
          workingDays > 0
            ? Math.round((effectivePresentDays / workingDays) * 100)
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

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validatePasswordForm = () => {
    if (!passwordData.newPassword) {
      toast.error("New password is required");
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }
    return true;
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsResettingPassword(true);

      const response = await updateProfile({
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword,
      });

      if (response) {
        toast.success("Password updated successfully");
        setShowPasswordReset(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsResettingPassword(false);
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          My Profile
        </h1>
        <p className="text-gray-600 mt-2">
          View your personal information and attendance statistics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="col-span-1 p-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-100 shadow-lg">
                <img
                  src={profilePicUrl || DUMMY_SVG}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DUMMY_SVG;
                  }}
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold mt-4 text-gray-900">{`${
              currentUser?.firstName || ""
            } ${currentUser?.lastName || ""}`}</h2>
            <div className="flex items-center mt-2 text-gray-600">
              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
              <p>{currentUser?.position?.title || "No Position"}</p>
            </div>

            {/* Attendance Stats */}
            <div className="w-full mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {attendanceStats.percentage}%
                </p>
                <p className="text-sm text-gray-600">Attendance</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {attendanceStats.leaveCount}
                </p>
                <p className="text-sm text-gray-600">Leave Days</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="col-span-1 lg:col-span-2 p-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-lg transition-all duration-300">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoField
                    label="Employee ID"
                    value={currentUser?.employeeId}
                    icon={<IdentificationIcon className="w-4 h-4" />}
                  />
                  <InfoField
                    label="Email"
                    value={currentUser?.email}
                    icon={<EnvelopeIcon className="w-4 h-4" />}
                  />
                  <InfoField
                    label="Phone"
                    value={currentUser?.phone}
                    icon={<PhoneIcon className="w-4 h-4" />}
                  />
                </div>
                <div className="space-y-4">
                  <InfoField
                    label="Department"
                    value={currentUser?.department?.name}
                    icon={<BuildingOfficeIcon className="w-4 h-4" />}
                  />
                  <InfoField
                    label="Position"
                    value={currentUser?.position?.title}
                    icon={<UserIcon className="w-4 h-4" />}
                  />
                  <InfoField
                    label="Join Date"
                    value={
                      currentUser?.joiningDate
                        ? new Date(currentUser.joiningDate).toLocaleDateString()
                        : "Not set"
                    }
                    icon={<CalendarIcon className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PhoneIcon className="w-5 h-5 mr-2 text-blue-600" />
                Emergency Contact
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoField
                    label="Contact Name"
                    value={currentUser?.emergencyContact?.name}
                  />
                  <InfoField
                    label="Relationship"
                    value={currentUser?.emergencyContact?.relationship}
                  />
                </div>
                <div className="space-y-4">
                  <InfoField
                    label="Contact Phone"
                    value={currentUser?.emergencyContact?.phone}
                    icon={<PhoneIcon className="w-4 h-4" />}
                  />
                  <InfoField
                    label="Contact Email"
                    value={currentUser?.emergencyContact?.email}
                    icon={<EnvelopeIcon className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>

            {/* Password Reset Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <LockClosedIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Password Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                >
                  {showPasswordReset ? "Cancel" : "Change Password"}
                </button>
              </div>

              {showPasswordReset && (
                <form
                  onSubmit={handlePasswordReset}
                  className="bg-gray-50 rounded-lg p-4 space-y-4"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? (
                            <EyeSlashIcon className="w-4 h-4" />
                          ) : (
                            <EyeIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div> */}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            handlePasswordChange("newPassword", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("new")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? (
                            <EyeSlashIcon className="w-4 h-4" />
                          ) : (
                            <EyeIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            handlePasswordChange(
                              "confirmPassword",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("confirm")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? (
                            <EyeSlashIcon className="w-4 h-4" />
                          ) : (
                            <EyeIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Password must be at least 6 characters long
                    </p>
                    <button
                      type="submit"
                      disabled={isResettingPassword}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center"
                    >
                      {isResettingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const InfoField = ({ label, value, icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">
      {label}
    </label>
    <div className="flex items-center space-x-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <p className="text-gray-900">{value || "Not set"}</p>
    </div>
  </div>
);

export default Profile;
