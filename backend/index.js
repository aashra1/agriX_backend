// importing
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./database/db');
const cors = require('cors');


// Making express app
const app = express();

// dotenv config
dotenv.config();

// // cloudinary config
// cloudinary.config({ 
//   cloud_name: process.env.CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// cors config
const corsOptions = {
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));


// Accepting json data
app.use(express.json());

// Accepting multipart/form-data
app.use(express.urlencoded({ extended: true }));

// creating test route
app.get("/test", (req,res) => {
    res.status(200).send("Hello");
});

// defining port
const PORT = process.env.PORT || 5000;

// run the server
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});

// exporting app
module.exports = app;
