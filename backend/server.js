const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoutes");
const productRoute = require("./routes/productRoutes");
const contactUsRoute = require("./routes/contactUsRoute");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");
const { Http2ServerRequest } = require("http2");

const app = express();

const PORT = process.env.PORT || 5000;

// MIDDLEWARES
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROUTES
app.use("/api/users/", userRoute);
app.use("/api/products/", productRoute);
app.use("/api/contactus/", contactUsRoute);

// Error handler
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log("DB connection successful");
    });
  })
  .catch((err) => console.log(err));
