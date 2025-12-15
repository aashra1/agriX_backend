import express, { Application } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route'; 
import connectDB from './database/db';


dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;

//database connection
connectDB();

// Middleware
app.use(bodyParser.json());

// Register Routes
app.use('/api/user', userRoutes); 

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at: http://localhost:${PORT}`);
});