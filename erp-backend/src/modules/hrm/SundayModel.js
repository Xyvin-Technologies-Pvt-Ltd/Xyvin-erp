const mongoose = require("mongoose");

const sundaySchema = new mongoose.Schema({
  sundayLeaveAvailable: {
    type: Boolean,
    default: true,
  },
  sundayDayOff: {
    type: Boolean,
    default: false,
  },
});

const Sunday = mongoose.model("Sunday", sundaySchema);

module.exports = Sunday;
