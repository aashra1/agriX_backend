const Users = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const OTP = require('../model/otpModel'); 
const nodemailer = require("nodemailer");


// Function for generating the OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};


//configuring nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "adhikarisneha0001@gmail.com",
    pass: "koqycslmnunmthqn",
    // user: process.env.EMAIL_email,
    // pass: process.env.EMAIL_PASSWORD,
  },
});


const resendOTP = async (req, res) => {
  try {
    // Assuming you have the email stored or passed along with the request
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    // Find the previous OTP record for the user
    const previousOTP = await OTP.findOne({ email });

    if (!previousOTP) {
      return res.status(404).json({ success: false, message: 'Previous OTP not found.' });
    }

    // Generate a new OTP
    const otp = generateOTP();

    // Send OTP to the stored email address
    await transporter.sendMail({
      from: '"Eventify" <adhikarisneha0001@gmail.com>',
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP for password reset is: ${otp}`,
    });

    // Update the existing OTP record with the new OTP
    previousOTP.otp = otp;
    previousOTP.isUsed = false;
    await previousOTP.save();

    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};





const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await Users.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP to database
    try {
      await OTP.create({ userId: user.id, otp, isUsed: false });
    } catch (error) {
      console.error("Error saving OTP to database:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to save OTP." });
    }

    // Send OTP to user's email
    await transporter.sendMail({
      from: '"Eventify" <adhikarisneha0001@gmail.com>',
      to: email,
      subject: "OTP Verification",
      text: `Your OTP for password reset is: ${otp}`,
    });

    // Update user's OTP in the database
    user.otp = otp;
    await user.save();

    console.log("OTP sent to user:", otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

// Controller function to verify OTP and update password
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    // Ensure OTP is provided
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required." });
    }

    // Find the OTP record for the user
    const otpRecord = await OTP.findOne({
      otp,
      isUsed: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // Mark the OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
};



const updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Ensure new password is provided
    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required." });
    }

    // Find the user by the userId associated with the OTP (assuming userId is stored in OTP model)
    const otpRecord = await OTP.findOne({
      OTP,
      isUsed: true, // Ensuring OTP has been used
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // Find the user by userId from the OTP record
    const user = await Users.findById(otpRecord.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Encrypt the new password
    const randomSalt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(newPassword, randomSalt);

    // Updating the user's password with the encrypted password
    user.password = encryptedPassword;

    // Clear OTP-related fields if needed
    user.otp = undefined;
    user.passwordUpdatedWithOTP = true; 
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "Failed to update password." });
  }
};



const register = async (req, res) => {
  const { fullName, username, email, phoneNumber, password, confirmPassword, role, permissions } = req.body;

  // Check if all fields are provided
  if (!fullName || !username || !email || !phoneNumber || !password || !confirmPassword) {
    return res.json({
      success: false,
      message: 'Please enter all the fields.',
    });
  }

  // Check if email is valid
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.json({
      success: false,
      message: 'Invalid email address.',
    });
  }

  // Check if username and full name are not numbers
  if (/^\d+$/.test(username) || /^\d+$/.test(fullName)) {
    return res.json({
      success: false,
      message: 'Username and full name cannot be numbers.',
    });
  }

  // Check if email already exists as a user
  const existingUser = await Users.findOne({ email });
  if (existingUser) {
    return res.json({
      success: false,
      message: 'Email address already exists.',
    });
  }

  // Check if password and confirm password match
  if (password !== confirmPassword) {
    return res.json({
      success: false,
      message: 'Password and confirm password do not match.',
    });
  }

  // Check if phone number is 10 digits
  const phoneNumberRegex = /^\d{10}$/;
  if (!phoneNumberRegex.test(phoneNumber)) {
    return res.json({
      success: false,
      message: 'Invalid phone number. Please enter a 10-digit phone number.',
    });
  }

  try {
    const randomSalt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, randomSalt);

    const newUser = new Users({
      fullName,
      username,
      email,
      phoneNumber,
      password: encryptedPassword,
      confirmPassword: encryptedPassword,
      role: role || 'user',
      permissions: permissions || ['read', 'write'],
    });

    await newUser.save();
    res.status(200).json({
      success: true,
      message: 'User created successfully.',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please enter both username and password.',
    });
  }

  try {
    const user = await Users.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist.',
      });
    }

    // Perform password verification
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      // Normal user login
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        success: true,
        message: 'User logged in successfully.',
        token,
        userData: user,
      });
    } else {
      // Admin login
      const token = jwt.sign(
        { id: user._id, isAdmin: true, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Admin logged in successfully.',
        token,
        userData: user,
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};



const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await Users.find({}).skip(skip).limit(limit);

    res.status(200).json({
      success: true,
      message: 'All users fetched successfully.',
      count: users.length,
      page,
      limit,
      users,
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Server Error',
      error,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userProfile = { ...user.toObject() };
    delete userProfile.password;

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully.",
      userProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const editUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.fullName = req.body.fullName;
    user.username = req.body.username;
    user.email = req.body.email;
    user.phoneNumber = req.body.phoneNumber;
    user.gender = req.body.gender;
    user.location = req.body.location;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      updatedUserProfile: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const userProfile = async (req, res) => {
  try {
    const user = await Users.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const deleteUserAccount = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await Users.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

module.exports = {
  sendOTP,
  resendOTP,
  verifyOTP,
  updatePassword,
  register,
  loginUser,
  getAllUsers,
  getUserProfile,
  editUserProfile,
  userProfile,
  deleteUserAccount,

};
