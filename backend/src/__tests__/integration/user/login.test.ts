import request from "supertest";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { UserModel } from "../../../model/user.model";
import app from "../../../app";

const testUser = {
  fullName: "Test User",
  email: "test_login@example.com",
  password: "test@1234",
  phoneNumber: "9876543210",
  address: "Kathmandu",
};

describe("User Login Integration Tests", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI ||
          "mongodb+srv://aashrapandey00:123PAssword@cluster0.0h1b7iy.mongodb.net/",
      );
    }

    const hashedPassword = await bcrypt.hash(testUser.password, 10);

    await UserModel.create({
      fullName: testUser.fullName,
      email: testUser.email,
      password: hashedPassword,
      phoneNumber: testUser.phoneNumber,
      address: testUser.address,
    });
  });

  // 2. Cleanup after tests
  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
  });

  describe("POST /api/user/login", () => {
    const loginCredentials = {
      email: testUser.email,
      password: testUser.password,
    };

    test("should log in the user successfully", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send(loginCredentials);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message", "Login Successful");
      expect(response.body).toHaveProperty("token");
    });

    test("should fail for non-existent user", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });

    test("should fail to login user with empty fields", async () => {
      const response = await request(app).post("/api/user/login").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid Credentials");
    });

    test("should fail for wrong password", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: testUser.email,
        password: "wrongpassword123",
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });
  });
});
