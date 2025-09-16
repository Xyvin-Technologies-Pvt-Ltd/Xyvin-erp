const cron = require("node-cron");
const Employee = require("../modules/hrm/employee/employee.model");
const attendanceModel = require("../modules/hrm/attendance/attendance.model");

exports.job = cron.schedule("2 0 * * 0", async () => {
  console.log("Running at 12:02 AM every Sunday");
  let now = new Date(); 
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

// Auto Absent at 10:15 disabled: handled dynamically (Late after 10:20)
exports.updateAbsents = { stop: () => {}, start: () => {} };
// exports.updateAbsents = cron.schedule("15 10 * * *",async () => {
//   console.log("Running every day at 10:02 AM");
//    let now = new Date();
//     const startOfDay = new Date();
//     startOfDay.setUTCHours(0, 0, 0, 0);
//     const endOfDay = new Date();
//     endOfDay.setUTCHours(23, 59, 59, 999);
//     let istDate = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
//     console.log(startOfDay, endOfDay, istDate);
//     const allEmployees = await Employee.find();
//     for (const record of allEmployees) {
//       const data = await attendanceModel.findOne({
//         employee: record._id,
//         date: { $gte: startOfDay, $lte: endOfDay },
//       });
//       console.log(data);
//       if (data === null) {
//         console.log("NULL");
//         await attendanceModel.create({
//           status: "Absent",
//           notes: "Employee absent",
//           shift: "Morning",
//           employee: record._id,
//           createdBy: record._id,
//           updatedBy: record._id,
//           createdAt: istDate,
//           updatedAt: istDate,
//           date: new Date(),
//         });
//       } else {
//         console.log("NOT NULL");
//       }
//     }
// }, {
//   timezone: "Asia/Kolkata"   
// });
