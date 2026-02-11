import mongoose from "mongoose";
import connectDB from "../database/db";

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});
