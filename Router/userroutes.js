const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const twilio = require("twilio");
const User = require("../model/model");
const Location = require("../model/Location");
const Controller = require("../controller/controllers");
const { generateRandomString } = require("../utils");
const axios = require("axios");
const qrcode = require("qrcode");
require("dotenv").config();

router.use(bodyParser.json());
router.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

router.use(bodyParser.urlencoded({ extended: false }));

const phoneNumbers = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

function sendOTP(phoneNumber, otp) {
  return client.messages
    .create({
      body: `Your OTP is: ${otp}`,
      from: +15412637006,
      to: phoneNumber,
    })
    .then((message) => {
      console.log(`OTP sent successfully. Message SID: ${message.sid}`);
    })
    .catch((err) => {
      console.error("Failed to send OTP:", err.message);
      throw err;
    });
}

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Get API status
 *     description: Get the status of the API
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             example:
 *               status: "API Works"
 *               message: "Welcome to User API"
 */

router.get("/", function (req, res) {
  res.json({
    status: "API Works",
    message: "Welcome to User API",
  });
});

/**
 * @swagger
 * /api/send:
 *   post:
 *     summary: Send OTP to a phone number
 *     description: Send an OTP to the provided phone number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Bad request, missing or invalid parameters
 *       500:
 *         description: Failed to send OTP
 */

router.post("/send", express.json(), (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  const otp = generateOTP();

  phoneNumbers[phoneNumber] = otp;

  sendOTP(phoneNumber, otp)
    .then(() => {
      res.json({ success: true, message: "OTP sent successfully" });
    })
    .catch((err) => {
      console.error(err);

      if (err.code === 20003) {
        res
          .status(500)
          .json({ error: "Failed to send OTP. Twilio authentication error." });
      } else {
        res
          .status(500)
          .json({ error: "Failed to send OTP", details: err.message });
      }
    });
});

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login with phone number and OTP
 *     description: Log in a user using their phone number and OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: The user's phone number
 *               otp:
 *                 type: string
 *                 description: The OTP received by the user
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Login successful
 *               user:
 *                 userId: string
 *                 phoneNumber: string
 *               token: null
 *               qrCodeDataURL: string
 *               sessionId: string
 *               secretKey: string
 *       400:
 *         description: Bad request, missing or invalid parameters
 *         content:
 *           application/json:
 *             example:
 *               error: Phone number and OTP are required
 *       401:
 *         description: Invalid OTP or user is already logged in
 *         content:
 *           application/json:
 *             example:
 *               error: Invalid OTP
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */
async function generateQRCode(qrCodeData) {
  try {
    const qrCodeDataURL = await qrcode.toDataURL(JSON.stringify(qrCodeData));
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error.message);
    throw error;
  }
}

module.exports = (io) => {
  router.post("/login", async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        return res
          .status(400)
          .json({ error: "Phone number and OTP are required" });
      }

      if (phoneNumbers[phoneNumber] && phoneNumbers[phoneNumber] == otp) {
        delete phoneNumbers[phoneNumber];

        let user = await User.findOne({ phoneNumber });

        if (!user) {
          user = new User({
            phoneNumber: phoneNumber,
          });
          console.log("New user created:", user);
        }

        if (user.loggedIn) {
          return res.status(401).json({ error: "User is already logged in" });
        }

        // Set lastLoginTime when user logs in
        user.lastLoginTime = new Date();
        await user.save();

        const secretKey = generateRandomString();
        const sessionId = generateRandomString();
        const userId = user._id;
        user.sessionId = sessionId;
        user.secretKey = secretKey;
        user.userId = userId;

        console.log("User details before saving:", user);

        await user.save();

        console.log("User details after saving:", user);

        const qrCodeData = {
          secretKey,
          sessionId,
          userId,
        };

        const qrCodeDataURL = await generateQRCode(qrCodeData);

        io.emit("userLoggedIn", {
          userId: user._id,
          phoneNumber: user.phoneNumber,
        });

        res.json({
          success: true,
          message: "Login successful",
          user: {
            userId: user._id,
            phoneNumber: user.phoneNumber,
          },
          token: null,
          qrCodeDataURL,
          sessionId,
          secretKey,
        });
      } else {
        res.status(401).json({ error: "Invalid OTP" });
      }
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  /**
   * @swagger
   * /api/scan:
   *   post:
   *     summary: Validate scanned data
   *     description: Validate the scanned data using sessionId, secretKey, and userId
   *     tags:
   *       - Authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               sessionId:
   *                 type: string
   *                 description: The session ID
   *               secretKey:
   *                 type: string
   *                 description: The secret key
   *               userId:
   *                 type: string
   *                 description: The user ID
   *     responses:
   *       200:
   *         description: Scanned data is valid
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               message: Scanned data is valid
   *       400:
   *         description: Bad request, missing or invalid parameters
   *         content:
   *           application/json:
   *             example:
   *               error: Invalid scanned data
   *       401:
   *         description: Invalid scanned data
   *         content:
   *           application/json:
   *             example:
   *               error: Invalid scanned data
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: Internal Server Error
   */

  async function validateScannedData(secretKey, sessionId, userId) {
    const expectedUser = await User.findOne({ userId, sessionId, secretKey });
    return !!expectedUser;
  }

  router.post("/scan", async (req, res) => {
    const { sessionId, secretKey, userId } = req.body;

    if (!sessionId || !secretKey || !userId) {
      return res.status(400).json({ error: "Invalid scanned data" });
    }

    const isValid = await validateScannedData(secretKey, sessionId, userId);

    if (isValid) {
      res.json({ success: true, message: "Scanned data is valid" });
    } else {
      res.status(401).json({ error: "Invalid scanned data" });
    }
  });

  /**
   * @swagger
   * /api/verify-secretkey:
   *   post:
   *     summary: Verify secret key
   *     description: Verify the provided secret key
   *     tags:
   *       - Authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               secretKey:
   *                 type: string
   *                 description: The secret key to be verified
   *     responses:
   *       200:
   *         description: Secret key is valid
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               message: Secret key is valid
   *               user:
   *                 userId: string
   *                 phoneNumber: string
   *                 sessionId: string
   *       400:
   *         description: Bad request, missing or invalid parameters
   *         content:
   *           application/json:
   *             example:
   *               error: secretKey is required
   *       401:
   *         description: Invalid secret key
   *         content:
   *           application/json:
   *             example:
   *               error: Invalid secret key
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             example:
   *               error: User not found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: Internal Server Error
   */
  router.post("/verify-secretkey", async (req, res) => {
    const { secretKey } = req.body;

    if (!secretKey) {
      return res.status(400).json({ error: "secretKey is required" });
    }

    try {
      const user = await User.findOne({ secretKey });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (secretKey !== user.secretKey) {
        return res.status(401).json({ error: "Invalid secret key" });
      }

      res.json({
        success: true,
        message: "Secret key is valid",
        user: {
          userId: user._id,
          phoneNumber: user.phoneNumber,
          sessionId: user.sessionId,
        },
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });

  /**
   * @swagger
   * /api/secretKey:
   *   get:
   *     summary: Get all secret keys
   *     description: Retrieve all secret keys from the users
   *     tags:
   *       - Authentication
   *     responses:
   *       200:
   *         description: Secret keys retrieved successfully
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               secretKeys: ["secretKey1", "secretKey2", ...]
   *       404:
   *         description: No users found
   *         content:
   *           application/json:
   *             example:
   *               error: No users found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: Internal Server Error
   */
  router.get("/secretKey", async (req, res) => {
    try {
      const users = await User.find();

      if (!users || users.length === 0) {
        return res.status(404).json({ error: "No users found" });
      }

      const secretKeys = users.map((user) => user.secretKey);

      res.json({
        success: true,
        secretKeys,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });

  /**
   * @swagger
   * /api/location:
   *   post:
   *     summary: Store user location details
   *     description: Endpoint to store user location details.
   *     tags:
   *       - Location
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ipAddress:
   *                 type: string
   *               latitude:
   *                 type: number
   *               longitude:
   *                 type: number
   *               countryName:
   *                 type: string
   *           example:
   *             ipAddress: "127.0.0.1"
   *             latitude: 40.7128
   *             longitude: -74.0060
   *             countryName: "string"
   *     responses:
   *       201:
   *         description: Location details stored successfully
   *       400:
   *         description: Bad request, missing or invalid parameters
   *       500:
   *         description: Internal Server Error
   */
  router.post("/location", async (req, res) => {
    try {
      const { ipAddress, latitude, longitude, countryName } = req.body;

      const newLocation = new Location({
        ipAddress,
        latitude,
        longitude,
        countryName,
      });

      await newLocation.save();

      res.status(201).json({ message: "Location details stored successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });

  /**
   * @swagger
   * /api/logout:
   *   post:
   *     summary: Log out user and set loggedIn status to false.
   *     description: Logs out the user by setting the user's loggedIn status to false if the session is still valid.
   *     tags:
   *       - Authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 description: The ID of the user to log out.
   *             required:
   *               - userId
   *     responses:
   *       '200':
   *         description: OK. Logout successful.
   *       '401':
   *         description: Unauthorized. Session expired or user not found.
   *       '500':
   *         description: Internal Server Error.
   */
  router.post("/logout", async (req, res) => {
    try {
      const { userId } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const sessionTimeoutMinutes = 1440; // 24 hours
      const currentTime = new Date();
      const lastLoginTime = user.lastLoginTime;

      if (
        lastLoginTime &&
        currentTime - lastLoginTime > sessionTimeoutMinutes * 60 * 1000
      ) {
        user.loggedIn = false;
        await user.save();
        return res
          .status(401)
          .json({ error: "Session expired. Please log in again." });
      }

      user.loggedIn = false;
      await user.save();

      res.json({ success: true, message: "Logout successful" });
    } catch (error) {
      console.error("Error in logout:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  /**
   * @swagger
   * /api/checkSession/{sessionId}:
   *   get:
   *     summary: Check session expiry.
   *     description: Check if the session with the provided session ID has expired or not.
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *         description: The session ID to check.
   *     responses:
   *       '200':
   *         description: OK. Session status returned successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 expired:
   *                   type: boolean
   *                   description: Indicates if the session has expired or not.
   *                 message:
   *                   type: string
   *                   description: Message indicating the status of the session.
   *       '404':
   *         description: Session not found.
   *       '500':
   *         description: Internal server error.
   */
  router.get("/checkSession/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;

      const session = await User.findOne({ sessionId: sessionId });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const sessionTimeoutMinutes = 1440; // 24 hours
      const currentTime = new Date();

      if (currentTime - session.createdAt > sessionTimeoutMinutes * 60 * 1000) {
        return res.json({ expired: true, message: "Session expired" });
      } else {
        return res.json({ expired: false, message: "Session still valid" });
      }
    } catch (error) {
      console.error("Error checking session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * @swagger
   * /api/user:
   *   get:
   *     summary: Get all users
   *     description: Retrieve a list of all users
   *     tags:
   *       - User
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               users: [{ userId: "123", name: "John Doe" }, { userId: "456", name: "Jane Doe" }]
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: Internal Server Error
   */
  router.route("/user").get(Controller.index);

  /**
   * @swagger
   * /api/user/{number}:
   *   get:
   *     summary: Get user by ID
   *     description: Retrieve details of a specific user by their ID
   *     tags:
   *       - User
   *     parameters:
   *       - in: path
   *         name: number
   *         schema:
   *           type: string
   *         required: true
   *         description: The ID of the user
   *     responses:
   *       200:
   *         description: User details retrieved successfully
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               user: { userId: "123", name: "John Doe" }
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             example:
   *               error: User not found
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: Internal Server Error
   */
  router
    .route("/user/:number")
    .get(Controller.view)
    .patch(Controller.update)
    .put(Controller.update)
    .delete(Controller.Delete);

  return router;
};
