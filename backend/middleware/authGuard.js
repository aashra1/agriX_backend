const jwt = require('jsonwebtoken');

const authGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("Authorization header missing!");
    return res.status(401).json({
      success: false,
      message: "Authorization header missing!"
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log("Token missing!");
    return res.status(401).json({
      success: false,
      message: "Token missing!"
    });
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token data:", decodedData); // Log the decoded token data
    req.user = {
      id: decodedData.id,
      role: decodedData.role,
      permissions: decodedData.permissions
    };
    next();
  } catch (error) {
    console.error("Invalid token!", error); // Log the error for debugging
    res.status(401).json({
      success: false,
      message: "Invalid token!"
    });
  }
};

const authGuardAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header missing!"
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token missing!"
    });
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decodedData.id,
      role: decodedData.role,
      permissions: decodedData.permissions
    };

    if (decodedData.isAdmin !== true) {
      return res.status(403).json({ // Changed to 403 for permission denied
        success: false,
        message: "Permission denied!"
      });
    }

    next();
  } catch (error) {
    console.error("Invalid token!", error); // Log the error for debugging
    res.status(401).json({
      success: false,
      message: "Invalid token!"
    });
  }
};

module.exports = {
  authGuard,
  authGuardAdmin,
};
