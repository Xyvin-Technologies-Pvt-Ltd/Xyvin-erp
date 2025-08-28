const cron = require("node-cron");
const Employee = require("../modules/hrm/employee/employee.model");
const attendanceModel = require("../modules/hrm/attendance/attendance.model");

exports.job = cron.schedule("2 0 * * 0", async () => {
  console.log("Running at 12:02 AM every Sunday");
  let now = new Date(); // current date & time
  let midnight = new Date(now.setHours(0, 0, 0, 0));
  let istDate = new Date(midnight.getTime() + (5 * 60 + 30) * 60 * 1000);
  const HrManager = await Employee.findOne({ role: "HR Manager" });
  const allEmployees = await Employee.find();
  for (const record of allEmployees) {
    await attendanceModel.create({
      status: "Day-Off",
      notes: "Scheduled day off",
      shift: "Morning",
      employee: record._id,
      createdBy: HrManager._id,
      updatedBy: HrManager._id,
      date: istDate,
    });
  }
  console.log("✅ Sunday 12:02AM: Attendance marked as Day-Off");
});

