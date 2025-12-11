const Users = require('../model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { fullName, username, email, phoneNumber, password, confirmPassword, role } = req.body;

    // 1. Check if all required fields are provided
    if (!fullName || !username || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please enter all the fields.',
      });
    }

    // 2. Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address.',
      });
    }

    // 3. Username and fullName cannot be numbers
    if (/^\d+$/.test(username) || /^\d+$/.test(fullName)) {
      return res.status(400).json({
        success: false,
        message: 'Username and full name cannot be numbers.',
      });
    }

    // 4. Check if email already exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email address already exists.',
      });
    }

    // 5. Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirm password do not match.',
      });
    }

    // 6. Validate phone number (10 digits)
    const phoneNumberRegex = /^\d{10}$/;
    if (!phoneNumberRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Please enter a 10-digit phone number.',
      });
    }

    // 7. Validate role
    const validRoles = ['User', 'Business'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either User or Business.',
      });
    }

    // 8. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 9. Create new user
    const newUser = new Users({
      fullName,
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      role: role || 'User', // default role is User
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
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
