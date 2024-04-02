const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const {Server} = require("socket.io");
const apiRoutes = require("./Router/userroutes.js");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mongodb = require("./config/mongodb.js");

const app = express();

// Initialize activeQRCodes properly
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

  socket.on("Token", (data) => {
    console.log("Received Token event with data:", data);

    if (isValidToken(data.token)) {
      socket.emit("TokenResponse", {
        success: true,
        message: "Token received successfully",
      });
    } else {
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

function isValidToken(token) {
  return token !== undefined && token !== null && token.trim() !== "";
}


// MongoDB connection
mongoose.connect(mongodb.url1, { useNewUrlParser: true, useUnifiedTopology: true })
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
