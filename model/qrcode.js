const mongoose = require('mongoose');

// Define a schema for the data to be saved in the database
const qrCodeSchema = new mongoose.Schema({
  channelName: String,
  qrCodeUrl: String
});

// Create a model based on the schema
const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;
