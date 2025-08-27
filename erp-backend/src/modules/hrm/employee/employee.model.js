const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      trim: true,
    },
    needToViewEvent: {
      type: Boolean,
      default: false,
    },
    taskViewPending: {
      type: Boolean,
      default: false,
    },
    leaveReqViewed: {
      type: Boolean,
      default: true,
    },
    projectViewPending: {
      type: Boolean,
      default: false,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [1, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    profilePicture: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: [true, "Position is required"],
    },
    joiningDate: {
      type: Date,
      required: [true, "Joining date is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave", "terminated", "resigned"],
      default: "active",
    },
    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"],
    },
    // Primary role kept for backward compatibility
    role: {
      type: String,
      enum: [
        "ERP System Administrator",
        "IT Manager",
        "Project Manager",
        "HR Manager",
        "Finance Manager",
        "Employee",
        "Sales Manager",
        "Admin",
        "Operation Officer",
      ],
      default: "Employee",
    },
    // New: support multiple roles
    roles: {
      type: [
        {
          type: String,
          enum: [
            "ERP System Administrator",
            "IT Manager",
            "Project Manager",
            "HR Manager",
            "Finance Manager",
            "Employee",
            "Sales Manager",
            "Admin",
            "Operation Officer",
          ],
        },
      ],
      default: undefined,
    },
    // New: support multiple roles while keeping backward compatibility with single role
    roles: [
      {
        type: String,
        enum: [
          "ERP System Administrator",
          "IT Manager",
          "Project Manager",
          "HR Manager",
          "Finance Manager",
          "Employee",
          "Sales Manager",
          "Admin",
          "Operation Officer",
        ],
      },
    ],
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      branchName: String,
      ifscCode: String,
    },
    personalInfo: {
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
      },
      maritalStatus: String,
      bloodGroup: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
    },
    documents: [
      {
        type: {
          type: String,
          required: true,
          enum: ["aadhaar", "pan", "passport"],
        },
        title: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        grade: String,
      },
    ],
    workExperience: [
      {
        company: String,
        position: String,
        startDate: Date,
        endDate: Date,
        responsibilities: [String],
      },
    ],
    skills: [String],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "User",
      // required: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for getting all attendance records
employeeSchema.virtual("attendance", {
  ref: "Attendance",
  localField: "_id",
  foreignField: "employee",
});

// Virtual for getting all leave records
employeeSchema.virtual("leaves", {
  ref: "Leave",
  localField: "_id",
  foreignField: "employee",
});

// Match password
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    console.log("Matching password...");
    console.log("Entered password:", enteredPassword);
    console.log("Stored hashed password:", this.password);

    if (!this.password) {
      console.log("No password stored for user");
      return false;
    }

    // Use bcrypt.compare to safely compare the passwords
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log("Password match result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Error matching password:", error);
    return false;
  }
};

// Encrypt password using bcrypt
employeeSchema.pre("save", async function (next) {
  try {
    console.log("Pre-save middleware running...");
    console.log("Password modified:", this.isModified("password"));

    // Skip hashing if password hasn't changed or if we have a custom flag to skip
    if (!this.isModified("password") || this.$__skipPasswordHashing) {
      console.log("Skipping password hash");
      return next();
    }

    console.log("Hashing password...");
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Password hashed successfully");
    next();
  } catch (error) {
    console.error("Error in password hashing:", error);
    next(error);
  }
});

// Ensure roles <-> role stay in sync for backward compatibility
employeeSchema.pre("save", function (next) {
  try {
    // If roles is provided, ensure legacy role reflects the first entry
    if (Array.isArray(this.roles) && this.roles.length > 0) {
      if (!this.role || this.isModified("roles")) {
        this.role = this.roles[0];
      }
    } else if (
      this.role &&
      (!Array.isArray(this.roles) || this.roles.length === 0)
    ) {
      // If only legacy role provided, initialize roles array
      this.roles = [this.role];
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Pre-save middleware to update department and position employee counts
employeeSchema.pre("save", async function (next) {
  if (
    this.isNew ||
    this.isModified("department") ||
    this.isModified("position")
  ) {
    const Department = mongoose.model("Department");
    const Position = mongoose.model("Position");

    // Update old department and position counts if they're being changed
    if (
      !this.isNew &&
      (this.isModified("department") || this.isModified("position"))
    ) {
      const oldEmployee = await this.constructor.findById(this._id);
      if (oldEmployee) {
        if (this.isModified("department")) {
          await Department.findByIdAndUpdate(oldEmployee.department, {
            $inc: { employeeCount: -1 },
          });
        }
        if (this.isModified("position")) {
          await Position.findByIdAndUpdate(oldEmployee.position, {
            $inc: { employeeCount: -1, currentOccupancy: -1 },
          });
        }
      }
    }

    // Update new department and position counts
    if (this.department) {
      await Department.findByIdAndUpdate(this.department, {
        $inc: { employeeCount: 1 },
      });
    }
    if (this.position) {
      await Position.findByIdAndUpdate(this.position, {
        $inc: { employeeCount: 1, currentOccupancy: 1 },
      });
    }
  }

  // Update isActive based on status
  if (this.isModified("status")) {
    this.isActive = this.status === "active";
  }

  this.updatedAt = Date.now();
  next();
});

// Pre-remove middleware to update department and position employee counts
employeeSchema.pre("deleteOne", { document: true }, async function (next) {
  const Department = mongoose.model("Department");
  const Position = mongoose.model("Position");

  if (this.department) {
    await Department.findByIdAndUpdate(this.department, {
      $inc: { employeeCount: -1 },
    });
  }
  if (this.position) {
    await Position.findByIdAndUpdate(this.position, {
      $inc: { employeeCount: -1, currentOccupancy: -1 },
    });
  }

  next();
});

// Add this middleware for findOneAndUpdate operations
employeeSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update && update.status) {
    this.set({ isActive: update.status === "active" });
  }
  // Sync roles and role for update operations
  if (update) {
    // Handle direct set in $set as well as top-level
    const setObj = update.$set || update;
    if (Array.isArray(setObj.roles) && setObj.roles.length > 0) {
      if (!setObj.role) {
        setObj.role = setObj.roles[0];
      }
    } else if (
      setObj.role &&
      (!Array.isArray(setObj.roles) || setObj.roles.length === 0)
    ) {
      setObj.roles = [setObj.role];
    }
    if (update.$set) {
      update.$set = setObj;
    } else {
      Object.assign(update, setObj);
    }
    this.setUpdate(update);
  }
  next();
});

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
