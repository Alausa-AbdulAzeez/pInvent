const asyncHandler = require("express-async-handler");
const sendEmail = require("../utils/sendEmail");

const contactUsController = asyncHandler(async (req, res) => {
  const { user } = req;

  const { subject, message } = req.body;

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!subject || !message) {
    res.status(400);
    throw new Error("Please provide the required details");
  }

  try {
    await sendEmail(
      subject,
      message,
      process.env.SEND_TO,
      process.env.EMAIL_USER
    );
    res.status(200).json("Reset email sent");
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent");
  }
});

module.exports = { contactUsController };
