import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { UserIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import useAuthStore from "@/stores/auth.store";
import useHrmStore from "@/stores/useHrmStore";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import api from "@/api/api";

// Get the backend URL without the API path
const BACKEND_URL = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:8080';
const DUMMY_SVG = `data:image/svg+xml;utf8,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'  fill='%23CBD5E1'>
    <circle cx='16' cy='10' r='6'/>
    <path d='M4 28c0-6.6 8-10 12-10s12 3.4 12 10v2H4v-2z'/>
  </svg>`;



const Profile = () => {
  const { user } = useAuthStore();
  const { getMyAttendance, getCurrentEmployee } = useHrmStore();

  const [currentUser, setCurrentUser] = useState(user);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
    percentage: 0,
    leaveCount: 0,
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

        // Handle profile picture URL
        if (userData.profilePicture) {
          let picturePath = userData.profilePicture;
          
          // If it's a full URL, use it as is
          if (picturePath.startsWith('http')) {
            setProfilePicUrl(picturePath);
          } else {
            // Clean up the path and construct the full URL
            picturePath = picturePath
              .replace(/^\/public/, '')
              .replace(/^public/, '')
              .replace(/\/+/g, '/');
            
            if (!picturePath.startsWith('/')) {
              picturePath = '/' + picturePath;
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
        <p className="text-gray-600 mt-2">View your personal information and attendance statistics</p>
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
            <h2 className="text-2xl font-bold mt-4 text-gray-900">{`${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`}</h2>
            <div className="flex items-center mt-2 text-gray-600">
              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
              <p>{currentUser?.position?.title || "No Position"}</p>
            </div>

            {/* Attendance Stats */}
            <div className="w-full mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-600">{attendanceStats.percentage}%</p>
                <p className="text-sm text-gray-600">Attendance</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-emerald-600">{attendanceStats.leaveCount}</p>
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
                  <InfoField label="Employee ID" value={currentUser?.employeeId} icon={<IdentificationIcon className="w-4 h-4" />} />
                  <InfoField label="Email" value={currentUser?.email} icon={<EnvelopeIcon className="w-4 h-4" />} />
                  <InfoField label="Phone" value={currentUser?.phone} icon={<PhoneIcon className="w-4 h-4" />} />
                </div>
                <div className="space-y-4">
                  <InfoField label="Department" value={currentUser?.department?.name} icon={<BuildingOfficeIcon className="w-4 h-4" />} />
                  <InfoField label="Position" value={currentUser?.position?.title} icon={<UserIcon className="w-4 h-4" />} />
                  <InfoField 
                    label="Join Date" 
                    value={currentUser?.joiningDate ? new Date(currentUser.joiningDate).toLocaleDateString() : "Not set"} 
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
                  <InfoField label="Contact Name" value={currentUser?.emergencyContact?.name} />
                  <InfoField label="Relationship" value={currentUser?.emergencyContact?.relationship} />
                </div>
                <div className="space-y-4">
                  <InfoField label="Contact Phone" value={currentUser?.emergencyContact?.phone} icon={<PhoneIcon className="w-4 h-4" />} />
                  <InfoField label="Contact Email" value={currentUser?.emergencyContact?.email} icon={<EnvelopeIcon className="w-4 h-4" />} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const InfoField = ({ label, value, icon }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    <div className="flex items-center space-x-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <p className="text-gray-900">{value || "Not set"}</p>
    </div>
  </div>
);

export default Profile;
