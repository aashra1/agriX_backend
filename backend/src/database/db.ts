import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    const dbUri = process.env.DB_URL;

    if (!dbUri) {
        console.error('FATAL ERROR: DB_URL is not defined.');
        process.exit(1); 
    }

    try {
        await mongoose.connect(dbUri);
        
        console.log('Connected to Database');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1); 
    }
};

export default connectDB;