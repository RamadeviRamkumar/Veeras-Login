const swaggerAutogen = require("swagger-autogen")();
const doc = {
  info: {
    title: "Veeras-Education-App",
    description: "Version 2.0"
  },
  host: "veeras-login.onrender.com",
  // basePath:"/dev",
};

const outputFile = "./swagger-output.json";
const routes = ["./index.js"];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);


