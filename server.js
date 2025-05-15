const express = require("express");
const app = express();
const authRoutes = require("./routes/route");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger/swagger.json");
require("dotenv").config();
const serverless = require("serverless-http");
const cors = require("cors");
const corsOptions = {
  origin: "*",
  method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to KampungToga API,");
});

app.use("/api", authRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// app.get("/api", (req, res) => {
//   res.json({ name: ["Rio", "Ijat", "Idin"] });
// });

// app.listen(8080, () => {
//   console.log("Server started on port 8080");
// });

module.exports.handler = serverless(app);
