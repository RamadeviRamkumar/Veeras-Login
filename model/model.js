const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    unique: true,
  },
  sessionId: {
    type: String,
    default: null,
  },
  secretKey: {
    type: String,
    default: null,
  },
  userId: {
    type: String,
    default: null,
  },
  loggedIn: {
    type: Boolean,
    default: false,
  },
  accessToken: {
    type: String,
    default: null,
  },
  lastLoginTime: {
    type: Date,
    default: null,
  },
});

userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);

module.exports = User;
