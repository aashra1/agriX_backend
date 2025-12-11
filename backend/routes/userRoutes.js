//importing

const express = require('express');
const router = express.Router();
const userController = require("../controller/userController");
const { authGuard, authGuardAdmin } = require('../middleware/authGuard');


//creating user api
router.post('/register', userController.register);

//creating login api
router.post('/login', userController.loginUser);

router.get("/profile/:userId", authGuard, userController.getUserProfile);

router.get("/getAll", authGuard, authGuardAdmin, userController.getAllUsers);

router.put("/edit/:userId", authGuard, userController.editUserProfile);

router.delete('/delete/:userId', authGuard, userController.deleteUserAccount);

// Route to send OTP via SMS
router.post('/sendOTP', userController.sendOTP)

module.exports = router;