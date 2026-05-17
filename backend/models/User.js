const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    // select: false means the hash is never included in query results
    // unless the caller explicitly opts in with .select("+password").
    // This prevents accidental exposure of the hash in any future query
    // that forgets to project it out.
    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    resetPasswordToken: {
      type: String
    },

    resetPasswordExpires: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);