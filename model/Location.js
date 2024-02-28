const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  // userId: {
  //   type: String,
  //   required: true,
  // },
  ipAddress: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  deviceId: {
    type: String,
    default: null,
  },
  countryName: {
    type: String,
  },
});

locationSchema.index({ location: "2dsphere" });

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
