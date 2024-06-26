const mongoose = require("mongoose");
const User = require("./model/model");
const Token = require("./model/Token");

// /**
//  * Function to validate the token
//  * @param {string} token - The token to be validated.
//  * @returns {Promise<boolean>} - Returns a Promise that resolves to true if the token is valid, false otherwise.
//  */
// async function isValidToken(token) {
//   try {
//     const tokenDocument = await Token.findOne({ token });
//    console.log("Data >>>> ", tokenDocument)
//     return tokenDocument?.token ? true : false ;
//   } catch (error) {
//     console.error("Error validating token:", error);
//     throw new Error("Internal Server Error");
//   }
// }

async function isValidToken(token) {
  try {
    const tokenDocument = await Token.findOne({ token });
    return !!tokenDocument; // Return true if tokenDocument is not null or undefined
  } catch (error) {
    console.error("Error validating token:", error);
    throw new Error("Internal Server Error");
  }
}
async function isValidToken(token) {
  try {
    const tokenDocument = await Token.findOne({ token });
    if (tokenDocument) {
      await Token.findOneAndDelete({ token }); // Delete the token from the database
      return true; // Return true if token exists and is deleted
    } else {
      return false; // Return false if token does not exist
    }
  } catch (error) {
    console.error("Error validating token:", error);
    throw new Error("Internal Server Error");
  }
}

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
  isValidToken,
  generateRandomString,
  generateOTP,
  saveOTPToDatabase,
  verifyOTPFromDatabase,
  sendOTP,
};