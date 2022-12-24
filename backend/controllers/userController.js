const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Token = require("../models/tokenModel");
const sendEmail = require("../utils/sendEmail");

// GENERATE TOKEN
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

/*


*/
// REGISTER NEW USER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  //   Check if user email exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email already in use");
  }

  //   Create new user
  const user = await User.create({ name, email, password });

  if (user) {
    const { _id, name, email, phone, photo, bio } = user;

    // Token
    const token = generateToken(_id);

    // Send cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: false,
    });

    res.status(201).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

/*


*/
// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("User not found, Please signup");
  }

  // Check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (user && isPasswordCorrect) {
    const { _id, name, email, phone, photo, bio } = user;
    const token = generateToken(_id);

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: false,
    });

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

/*


*/
// Logout user
const logoutUser = asyncHandler((req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: false,
  });

  res.status(200).json({ message: "User logged out successfully" });
});

/*


*/
// FETCH USER
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, phone, photo, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

/*


*/
// GET LOGIN STATUS
const loginStatus = asyncHandler(async (req, res) => {
  const { token } = await req.cookies;

  if (!token) {
    return res.json(false);
  }

  // CHECK TOKEN VALIDITY
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!verifiedToken) {
    return res.json(false);
  }

  return res.json(true);
});

/*


*/
// UPDATE USER
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(401);
    throw new Error("User not found");
  }

  const { name, email, phone, photo, bio } = user;

  user.email = email;
  user.name = req.body.name || name;
  user.phone = req.body.phone || phone;
  user.photo = req.body.photo || photo;
  user.bio = req.body.bio || bio;

  const updatedUser = await user.save();

  if (!updateUser) {
    res.status(401);
    throw new Error("Error updating user");
  }

  res.status(200).json(updatedUser);
});

/*


*/
// UPDATE PASSWORD
const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // CHECK USER VALIDITY
  if (!user) {
    res.status(401);
    throw new Error("User not found");
  }

  const { password } = user;
  const updatedPassword = req.body.password;
  const oldPassword = req.body.oldPassword;

  // CHECK IF PASSWORD INPUT IS EMPTY
  if (!updatedPassword || !oldPassword) {
    res.status(400);
    throw new Error("Please input all required parameters");
  }

  // COMPARE PASSWORDS
  const isPasswordCorrect = await bcrypt.compare(oldPassword, password);
  if (!isPasswordCorrect) {
    res.status(400);
    throw new Error("Incorrect password");
  }

  if (updatedPassword.length < 6) {
    res.status(400);
    throw new Error("Password should be more than 6 characters");
  }

  user.password = updatedPassword;
  const updatedUser = await user.save();

  if (!updatedUser) {
    res.status(401);
    throw new Error("Error updating user password");
  }

  res.status(200).json("Password update successful");
});

/*


*/
// FORGOT PASSWORD
const forgotpassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Please input email");
  }

  // Check email validity
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User does not exist");
  }

  const token = await Token.findOne({ userId: user._id });

  if (token) {
    console.log("token exists");
    await token.deleteOne();
  }

  // // CREATE RESET TOKEN
  const resetToken = crypto.randomBytes(32).toString("hex") + user._id;

  // HASH TOKEN BEFORE SAVING TO THE DB

  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // SAVE TOKEN TO THE DB
  await new Token({
    userId: user._id,
    token: hashedResetToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000),
  }).save();

  // CONSTRUCT RESET URL
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // RESET MESSAGE
  const message = `
  <h2>Hello ${user.name}</h2>
  <p>Please use the URL below to reset your password</p>
  <p>This link is valid for 30 minutes only</p>

  <a href=${resetUrl} >${resetUrl}</a>

  <p>Regards...</P>
  `;

  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json("Reset email sent");
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent");
  }
});

/*


*/
// RESET PASSWORD
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  if (!password) {
    res.status(400);
    throw new Error("Please input password");
  }

  // HASH TOKEN BEFORE BEFORE COMPARING TO THE TOKEN IN THE DB
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // FIND TOKEN AND CHECK VALIDITY
  const token = await Token.findOne({
    token: hashedResetToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!token) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  // FIND USER USING THE ASSOCIATED USERID
  const user = await User.findOne({ _id: token.userId });
  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  // UPDATE USER PASSWORD
  user.password = password;
  await user.save();

  res.status(200).json("Password reset successful, please login");
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser,
  updatePassword,
  forgotpassword,
  resetPassword,
};
