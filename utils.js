const mongoose = require("mongoose");
// const twilio = require("twilio");

// const twilioClient = twilio(
//   "AC66491e329ebd72deaa4d9d209336beba",
//   "37885081d742674de2cd960d46279581"
// );

const User = require("./model/model");

function generateRandomString(length = 10) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}

async function saveOTPToDatabase(phoneNumber, otp, location) {
  try {
    const updateFields = { otp };

    if (location) {
      
      const coordinates = location.map((coord) =>
        parseFloat(coord.coordinates[0])
      );
      updateFields.location = coordinates;
    }

    await User.findOneAndUpdate({ phoneNumber }, updateFields, {
      upsert: true,
    });
  } catch (error) {
    throw error;
  }
}

async function verifyOTPFromDatabase(phoneNumber, otp) {
  try {
    const user = await User.findOne({ phoneNumber });
    return user && user.otp === otp;
  } catch (error) {
    throw error;
  }
}

async function sendOTP(phoneNumber, otp) {
  try {
    await twilioClient.messages.create({
      body: `Your OTP is: ${otp}`,
      from: "+12175745340",
      to: phoneNumber,
    });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  generateRandomString,
  generateOTP,
  saveOTPToDatabase,
  verifyOTPFromDatabase,
  sendOTP,
};