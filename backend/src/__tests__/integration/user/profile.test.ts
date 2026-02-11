import request from "supertest";
import mongoose from "mongoose";
import app from "../../../index";
import { UserModel } from "../../../model/user.model";

const testUser = {
  fullName: "Test User",
  email: "profiletest@example.com",
  password: "test@1234",
  phoneNumber: "9876543210",
  address: "Kathmandu",
  username: "profileuser",
};

describe("User Profile Integration Tests", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI ||
          "mongodb+srv://aashrapandey00:123PAssword@cluster0.0h1b7iy.mongodb.net/",
      );
    }

    await request(app).post("/api/user/register").send(testUser);

    const loginRes = await request(app).post("/api/user/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.token;
    userId = loginRes.body.user._id;
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
  });

  describe("GET /api/user/me", () => {
    test("should fail if no token provided", async () => {
      const response = await request(app).get("/api/user/me");
      expect(response.status).toBe(401);
    });

    test("should return the authenticated user profile", async () => {
      const response = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("profile");
      expect(response.body.profile.email).toBe(testUser.email);
    });
  });

  describe("PATCH /api/user/me", () => {
    test("should update profile successfully", async () => {
      const response = await request(app)
        .patch("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ fullName: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("updatedUser");
      expect(response.body.updatedUser.fullName).toBe("Updated Name");
    });

    test("should fail with invalid data (Zod validation)", async () => {
      const response = await request(app)
        .patch("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("DELETE /api/user/me", () => {
    test("should delete user account", async () => {
      const response = await request(app)
        .delete("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User deleted");
    });
  });
});
