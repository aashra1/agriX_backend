const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    validate: {
      validator: function(v) {
        return /^(male|female|other)$/i.test(v); // case-insensitive match
      },
      message: props => `${props.value} is not a valid gender!`
    }
  },
  location: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    default: "user",
  },
  permissions: {
    type: [String],
    default: ["read", "write"],
  },
});

// Add case-insensitive enum validation for gender
userSchema.path('gender').validate(function(value) {
  const validGenders = ['male', 'female', 'other'];
  return validGenders.includes(value.toLowerCase());
}, 'Invalid gender value.');

const Users = mongoose.model("users", userSchema);
module.exports = Users;
