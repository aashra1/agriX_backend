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
<<<<<<< HEAD
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI ||
          "mongodb+srv://aashrapandey00:123PAssword@cluster0.0h1b7iy.mongodb.net/",
      );
    }

=======
>>>>>>> 38b956dd041565fa8c9ce76efabd3b4977ddae55
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await UserModel.create({
      fullName: testUser.fullName,
      email: testUser.email,
      password: hashedPassword,
      phoneNumber: testUser.phoneNumber,
    });
  });
  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  describe("POST /api/user/login", () => {
    test("should log in the user successfully", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({ email: testUser.email, password: testUser.password });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Login successful");
      expect(response.body).toHaveProperty("token");
    });

    test("should fail for wrong password", async () => {
      const response = await request(app)
        .post("/api/user/login")
        .send({ email: testUser.email, password: "wrongpassword" });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    test("should fail to login user with empty fields", async () => {
      const response = await request(app).post("/api/user/login").send({});
      expect(response.status).toBe(400);
    });
  });
});
