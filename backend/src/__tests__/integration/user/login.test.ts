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
        process.env.MONGO_URI || "mongodb://localhost:27017/testdb",
      );
    }
    await UserModel.deleteMany({ email: testUser.email });
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await UserModel.create({ ...testUser, password: hashedPassword });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
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
