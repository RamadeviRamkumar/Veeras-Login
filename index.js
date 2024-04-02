const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const apiRoutes = require("./Router/userroutes.js");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mongodb = require("./config/mongodb.js");
const { isValidToken } = require('./utils.js'); 

const app = express();


const activeQRCodes = new Map();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Swagger setup
const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Veeras-Education-App',
      version: '1.0.0',
    },
    servers: [
      {
        url: "http://localhost:4000/"
      },
      {
        url: "https://veeras-login.onrender.com"
      }
    ]
  },
  apis: ['./Router/userroutes.js'],
};

const swaggerspecs = swaggerJsdoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerspecs));

// Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected on WebSocket");

  socket.on("Token", async (data) => {
    console.log("Received Token event with data:", data);

    // Check if the token is valid
    if (isValidToken(data.token)) {
      // Emit a success message
      socket.emit("TokenResponse", {
        success: true,
        message: "Token received successfully",
      });

      try {
        // Remove the token from the database
        await Token.findOneAndDelete({ token: data.token });
        console.log("Token removed:", data.token);
      } catch (error) {
        console.error("Error removing token:", error);
        // Handle error if token removal fails
      }
    } else {
      // Emit an error message for invalid token
      socket.emit("TokenResponse", {
        success: false,
        message: "Invalid token",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from WebSocket");
  });
});

// MongoDB connection
mongoose.connect(mongodb.url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Routes
app.get("/", (req, res) => res.send("Welcome to Signin Page"));
app.use("/api", apiRoutes(io, activeQRCodes)); // Pass activeQRCodes to apiRoutes

// Start the server
const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log("Server running on port " + port);
});

module.exports = { app, server, io };
