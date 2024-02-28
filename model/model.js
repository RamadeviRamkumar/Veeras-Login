const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    unique: true,
  },
  // location: {
  //   type: {
  //     type: String,
  //     enum: ["Point"],
  //     required: true,
  //   },
  //   coordinates: {
  //     type: [Number],
  //     required: true,
  //     default: [0, 0],
  //   },
  // },
  // deviceId: {
  //   type: String,
  //   default: null,
  // },
  // ipAddress: {
  //   type: String,
  //   required: true,
  // },
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
  // countryName: {
  //   type: String,
  // },
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
