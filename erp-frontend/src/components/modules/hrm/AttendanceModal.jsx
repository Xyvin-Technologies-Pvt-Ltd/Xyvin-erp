import { Fragment, useState, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-hot-toast";
import useHrmStore from "../../../stores/useHrmStore";
import * as hrmService from "../../../api/hrm.service";

const AttendanceModal = ({ onClose, onSuccess }) => {
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [dayAttendanceMap, setDayAttendanceMap] = useState({});
  const { createBulkAttendance, fetchEmployees } = useHrmStore();

  // Add status icons mapping
  const statusIcons = {
    Present: <SunIcon className="h-5 w-5 text-green-500" />,
    Late: <ClockIcon className="h-5 w-5 text-yellow-500" />,
    "Early-Leave": (
      <ArrowRightOnRectangleIcon className="h-5 w-5 text-orange-500" />
    ),
    "Half-Day": <CalendarIcon className="h-5 w-5 text-blue-500" />,
    "On-Leave": <ExclamationCircleIcon className="h-5 w-5 text-purple-500" />,
    Absent: <ExclamationCircleIcon className="h-5 w-5 text-red-500" />,
    Holiday: <CalendarIcon className="h-5 w-5 text-green-500" />,
    "Day-Off": <MoonIcon className="h-5 w-5 text-gray-500" />,
  };

  // Add automatic notes based on status
  const getDefaultNotes = (status) => {
    switch (status) {
      case "Late":
        return "Employee arrived late";
      case "Early-Leave":
        return "Employee left early";
      case "Half-Day":
        return "Half day attendance";
      case "On-Leave":
        return "Employee on leave";
      case "Absent":
        return "Employee absent";
      case "Holiday":
        return "Holiday";
      case "Day-Off":
        return "Scheduled day off";
      default:
        return "";
    }
  };

  const isTimeRequired = (status) => {
    return !["Holiday", "Absent", "On-Leave", "Day-Off"].includes(status);
  };

  const isAttendanceRequired = (status) => {
    return !["Holiday", "Absent", "On-Leave", "Day-Off"].includes(status);
  };

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employees = await fetchEmployees();
        console.log("Loaded employees:", employees);
        const activeOnly = Array.isArray(employees)
          ? employees.filter((e) => (e?.status || '').toLowerCase() === 'active')
          : [];
        setActiveEmployees(activeOnly);
        setFilteredEmployees(activeOnly);
      } catch (error) {
        console.error("Error loading employees:", error);
        toast.error("Failed to load employees");
      }
    };
    loadEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const loadDayAttendance = async () => {
      try {
        const dateStr = formik.values.date;
        if (!dateStr) return;
        const startDate = new Date(`${dateStr}T00:00:00.000Z`).toISOString();
        const endDate = new Date(`${dateStr}T23:59:59.999Z`).toISOString();
        const response = await hrmService.getAttendance({ startDate, endDate });
        const records = response?.data?.attendance || [];
        const map = {};
        records.forEach((rec) => {
          const emp = rec.employee || {};
          const key1 = (emp.id || emp._id || "").toString();
          if (!key1) return;
          map[key1] = rec;
        });
        setDayAttendanceMap(map);
      } catch (error) {
        console.error("Failed to load day attendance:", error);
      }
    };
    // Delay execution until formik is initialized
    loadDayAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* mount and when date changes via formik change handler below */]);

  const formik = useFormik({
    initialValues: {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].slice(0, 5),
      type: "checkIn",
      selectedEmployees: [],
      status: "Present",
      shift: "Morning",
      notes: "",
    },
    validationSchema: Yup.object({
      date: Yup.date().required("Date is required"),
      time: Yup.string().when('status', {
        is: (status) => isTimeRequired(status),
        then: (schema) => schema.required("Time is required"),
        otherwise: (schema) => schema.optional(),
      }),
      type: Yup.string()
        .oneOf(["checkIn", "checkOut"])
        .when('status', {
          is: (status) => isAttendanceRequired(status),
          then: (schema) => schema.required("Type is required"),
          otherwise: (schema) => schema.optional(),
        }),
      selectedEmployees: Yup.array().min(1, "Select at least one employee"),
      status: Yup.string()
        .oneOf([
          "Present",
          "Late",
          "Early-Leave",
          "Half-Day",
          "On-Leave",
          "Absent",
          "Holiday",
          "Day-Off",
        ])
        .required("Status is required"),
      shift: Yup.string()
        .oneOf(["Morning", "Evening", "Night"])
        .required("Shift is required"),
      notes: Yup.string().max(500, "Notes must be less than 500 characters"),
    }),
    onSubmit: async (values) => {
      try {
        console.log(
          "Selected employees before validation:",
          values.selectedEmployees
        ); // Debug log
        if (
          !values.selectedEmployees ||
          values.selectedEmployees.length === 0
        ) {
          toast.error("Please select at least one employee");
          return;
        }

        const validEmployeeIds = values.selectedEmployees
          .filter((id) => id && String(id).trim() !== "")
          .map((id) => String(id).trim());

        console.log("Valid employee IDs:", validEmployeeIds); // Debug log

        if (validEmployeeIds.length === 0) {
          toast.error("No valid employees selected");
          return;
        }

        if (!isAttendanceRequired(values.status)) {
          const eligibleIds = validEmployeeIds.filter((id) => {
            const rec = dayAttendanceMap[id];
            return !rec; // no record yet for the date
          });

          if (eligibleIds.length === 0) {
            toast.error("No eligible employees to record for this date");
            return;
          }

          const attendanceData = eligibleIds.map((employeeId) => ({
            employee: employeeId,
            date: values.date,
            status: values.status,
            shift: values.shift,
            notes: values.notes,
          }));

          console.log("Attendance data to be sent:", attendanceData); // Debug log
          await createBulkAttendance(attendanceData);
          toast.success("Attendance recorded successfully");
          try {
            const startDate = new Date(`${values.date}T00:00:00.000Z`).toISOString();
            const endDate = new Date(`${values.date}T23:59:59.999Z`).toISOString();
            const response = await hrmService.getAttendance({ startDate, endDate });
            const records = response?.data?.attendance || [];
            const map = {};
            records.forEach((rec) => {
              const emp = rec.employee || {};
              const key1 = (emp.id || emp._id || "").toString();
              if (!key1) return;
              map[key1] = rec;
            });
            setDayAttendanceMap(map);
          } catch (e) {
            // ignore
          }
          formik.setFieldValue("selectedEmployees", []);
          onSuccess();
          return;
        }

        const eligibleIds = validEmployeeIds.filter((id) => {
          const rec = dayAttendanceMap[id];
          if (values.type === "checkIn") {
            return !rec; // no record yet for the date
          }
          return !!rec?.checkIn?.time && !rec?.checkOut?.time;
        });

        if (eligibleIds.length === 0) {
          toast.error("No eligible employees to record for this date");
          return;
        }

        const attendanceData = eligibleIds.map((employeeId) => {
          const datetime = new Date(`${values.date}T${values.time}`);
          if (values.type === "checkIn") {
            return {
              employee: employeeId,
              date: values.date,
              checkIn: {
                time: datetime,
                device: "Web",
                ipAddress: "",
              },
              status: values.status, // Use the selected status, not hardcoded "Present"
              shift: values.shift,
              notes: values.notes,
            };
          }
          return {
            employee: employeeId,
            date: values.date,
            checkOut: {
              time: datetime,
              device: "Web",
              ipAddress: "",
            },
            shift: values.shift,
            notes: values.notes,
          };
        });

        console.log("Attendance data to be sent:", attendanceData); // Debug log
        await createBulkAttendance(attendanceData);
        toast.success("Attendance recorded successfully");
        try {
          const startDate = new Date(`${values.date}T00:00:00.000Z`).toISOString();
          const endDate = new Date(`${values.date}T23:59:59.999Z`).toISOString();
          const response = await hrmService.getAttendance({ startDate, endDate });
          const records = response?.data?.attendance || [];
          const map = {};
          records.forEach((rec) => {
            const emp = rec.employee || {};
            const key1 = (emp.id || emp._id || "").toString();
            if (!key1) return;
            map[key1] = rec;
          });
          setDayAttendanceMap(map);
        } catch (e) {
          // ignore
        }
        formik.setFieldValue("selectedEmployees", []);
        onSuccess();
      } catch (error) {
        console.error("Attendance Error:", error);
        let errorMessage = "Failed to record attendance";
        
        if (error.response?.data?.data?.errors) {
          const errors = error.response.data.data.errors;
          if (errors.length > 0) {
            errorMessage = errors.map(err => 
              `Employee ${err.employee}: ${err.error}`
            ).join('\n');
          }
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        toast.error(errorMessage);
      }
    },
  });

  useEffect(() => {
    const refresh = async () => {
      try {
        const dateStr = formik.values.date;
        if (!dateStr) return;
        const startDate = new Date(`${dateStr}T00:00:00.000Z`).toISOString();
        const endDate = new Date(`${dateStr}T23:59:59.999Z`).toISOString();
        const response = await hrmService.getAttendance({ startDate, endDate });
        const records = response?.data?.attendance || [];
        const map = {};
        records.forEach((rec) => {
          const emp = rec.employee || {};
          const key1 = (emp.id || emp._id || "").toString();
          if (!key1) return;
          map[key1] = rec;
        });
        setDayAttendanceMap(map);
      } catch (error) {
        console.error("Failed to refresh day attendance:", error);
      }
    };
    refresh();
  }, [formik.values.date, formik.values.type]);

  const isEmployeeDisabled = (employee) => {
    if (employee.status && employee.status !== 'active') {
      return true;
    }
    
    const key = (employee.id || employee._id || "").toString();
    const rec = dayAttendanceMap[key];
    
    if (!isAttendanceRequired(formik.values.status)) {
      return !!rec;
    }
    
    if (formik.values.type === "checkIn") {
      return !!rec;
    }
    if (!rec) return true;
    const hasCheckIn = !!rec?.checkIn?.time;
    const hasCheckOut = !!rec?.checkOut?.time;
    return !hasCheckIn || hasCheckOut;
  };

  const eligibleFilteredEmployees = useMemo(
    () => filteredEmployees.filter((e) => !isEmployeeDisabled(e)),
    [filteredEmployees, dayAttendanceMap, formik.values.type, formik.values.status]
  );

  const handleEmployeeSelection = (employeeId, checked) => {
    console.log("Handling employee selection:", { employeeId, checked }); // Debug log
    const currentSelected = [...formik.values.selectedEmployees];
    let newSelected;

    if (checked) {
      newSelected = [...currentSelected, employeeId];
    } else {
      newSelected = currentSelected.filter((id) => id !== employeeId);
    }

    console.log("New selected employees:", newSelected); // Debug log
    formik.setFieldValue("selectedEmployees", newSelected);
  };

  return (
    <Transition.Root show={true} as={ Fragment}>
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
                      Record Bulk Attendance
                    </Dialog.Title>

                    <form
                      onSubmit={formik.handleSubmit}
                      className="mt-6 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="date"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Date
                          </label>
                          <input
                            type="date"
                            id="date"
                            name="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            {...formik.getFieldProps("date")}
                          />
                          {formik.touched.date && formik.errors.date && (
                            <p className="mt-1 text-sm text-red-600">
                              {formik.errors.date}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="time"
                            className={`block text-sm font-medium text-gray-700 ${
                              !isTimeRequired(formik.values.status) ? 'opacity-50' : ''
                            }`}
                          >
                            Time {!isTimeRequired(formik.values.status) && '(Not required)'}
                          </label>
                          <input
                            type="time"
                            id="time"
                            name="time"
                            disabled={!isTimeRequired(formik.values.status)}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                              !isTimeRequired(formik.values.status) ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            {...formik.getFieldProps("time")}
                          />
                          {formik.touched.time && formik.errors.time && (
                            <p className="mt-1 text-sm text-red-600">
                              {formik.errors.time}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="type"
                            className={`block text-sm font-medium text-gray-700 ${
                              !isAttendanceRequired(formik.values.status) ? 'opacity-50' : ''
                            }`}
                          >
                            Type {!isAttendanceRequired(formik.values.status) && '(Not required)'}
                          </label>
                          <select
                            id="type"
                            name="type"
                            disabled={!isAttendanceRequired(formik.values.status)}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                              !isAttendanceRequired(formik.values.status) ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            {...formik.getFieldProps("type")}
                          >
                            <option value="checkIn">Check In</option>
                            <option value="checkOut">Check Out</option>
                          </select>
                          {formik.touched.type && formik.errors.type && (
                            <p className="mt-1 text-sm text-red-600">
                              {formik.errors.type}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="status"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Status
                          </label>
                          <div className="relative">
                            <select
                              id="status"
                              name="status"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-10"
                              {...formik.getFieldProps("status")}
                              onChange={(e) => {
                                formik.handleChange(e);
                                // Set default notes when status changes
                                const newStatus = e.target.value;
                                const currentNotes = formik.values.notes;
                                const defaultNotes = getDefaultNotes(newStatus);
                                if (
                                  !currentNotes ||
                                  currentNotes ===
                                    getDefaultNotes(formik.values.status)
                                ) {
                                  formik.setFieldValue("notes", defaultNotes);
                                }
                              }}
                            >
                              {Object.keys(statusIcons).map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                              {statusIcons[formik.values.status]}
                            </div>
                          </div>
                          {formik.touched.status && formik.errors.status && (
                            <p className="mt-1 text-sm text-red-600">
                              {formik.errors.status}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="shift"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Shift
                          </label>
                          <select
                            id="shift"
                            name="shift"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            {...formik.getFieldProps("shift")}
                          >
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                            <option value="Night">Night</option>
                          </select>
                          {formik.touched.shift && formik.errors.shift && (
                            <p className="mt-1 text-sm text-red-600">
                              {formik.errors.shift}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label
                            htmlFor="notes"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Notes
                          </label>
                          <div className="relative">
                            <textarea
                              id="notes"
                              name="notes"
                              rows={2}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Add any additional notes..."
                              {...formik.getFieldProps("notes")}
                            />
                            <div className="absolute right-2 top-2">
                              {statusIcons[formik.values.status]}
                            </div>
                          </div>
                          {formik.touched.notes && formik.errors.notes && (
                            <p className="mt-1 text-sm text-red-600">
                              {formik.errors.notes}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Select Employees
                          </label>
                          <div className="flex gap-2 mt-2 mb-2">
                          <input
                              type="text"
                              placeholder="Search employees by name or ID..."
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              onChange={(e) => {
                                const searchTerm = e.target.value.toLowerCase();
                                if (!searchTerm.trim()) {
                                  setFilteredEmployees(activeEmployees);
                                  return;
                                }
                                const filtered = activeEmployees.filter(
                                  (emp) =>
                                    (emp.firstName || "")
                                      .toLowerCase()
                                      .includes(searchTerm) ||
                                    (emp.lastName || "")
                                      .toLowerCase()
                                      .includes(searchTerm) ||
                                    (emp.employeeId || "")
                                      .toLowerCase()
                                      .includes(searchTerm)
                                );
                                setFilteredEmployees(filtered);
                              }}
                            />
                          </div>
                          <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-300 p-2">
                            <div className="sticky top-0 bg-white border-b pb-2 mb-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="select-all-employees"
                                  checked={
                                    eligibleFilteredEmployees.length > 0 &&
                                    formik.values.selectedEmployees.length ===
                                      eligibleFilteredEmployees.length
                                  }
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    const allEmployeeIds = isChecked
                                      ? eligibleFilteredEmployees.map((emp) => emp.id)
                                      : [];
                                    formik.setFieldValue(
                                      "selectedEmployees",
                                      allEmployeeIds
                                    );
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                  htmlFor="select-all-employees"
                                  className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                  Select All
                                </label>
                              </div>
                            </div>
                            {filteredEmployees.map((employee) => (
                              <div
                                key={employee.id}
                                className="flex items-center space-x-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  id={`employee-${employee.id}`}
                                  name="selectedEmployees"
                                  value={employee.id}
                                  checked={formik.values.selectedEmployees.includes(
                                    employee.id
                                  )}
                                  disabled={isEmployeeDisabled(employee)}
                                  onChange={(e) => {
                                    if (isEmployeeDisabled(employee)) return;
                                    handleEmployeeSelection(
                                      employee.id,
                                      e.target.checked
                                    );
                                  }}
                                  className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                                    isEmployeeDisabled(employee) ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                />
                                <label
                                  htmlFor={`employee-${employee.id}`}
                                  className={`text-sm ${
                                    isEmployeeDisabled(employee) 
                                      ? "opacity-60 cursor-not-allowed text-gray-500" 
                                      : "text-gray-700 cursor-pointer"
                                  }`}
                                >
                                  {employee.firstName} {employee.lastName} (
                                  {employee.employeeId || "No ID"})
                                  {employee.status && employee.status !== 'active' && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      {employee.status}
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                          {formik.touched.selectedEmployees &&
                            formik.errors.selectedEmployees && (
                              <p className="mt-1 text-sm text-red-600">
                                {formik.errors.selectedEmployees}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                        >
                          Record Attendance
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

export default AttendanceModal;
