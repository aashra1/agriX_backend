import request from "supertest";
import mongoose from "mongoose";
import { UserModel } from "../../../model/user.model";
import app from "../../../app";

describe("User Registration Integration Tests", () => {
  const validUser = {
    fullName: "Registration Test",
    email: "reg_test@example.com",
    password: "Password@123",
    phoneNumber: "9800000000",
    address: "Kathmandu",
    isAdmin: false,
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI ||
          "mongodb+srv://aashrapandey00:123PAssword@cluster0.0h1b7iy.mongodb.net/",
      );
    }
  });

  afterEach(async () => {
    await UserModel.deleteMany({ email: validUser.email });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/user/register", () => {
    test("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/user/register")
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/registered successfully/);
      expect(response.body.user).toHaveProperty("email", validUser.email);
      expect(response.body.user).not.toHaveProperty("password");
    });

    test("should fail if email already exists", async () => {
      await request(app).post("/api/user/register").send(validUser);

      const response = await request(app)
        .post("/api/user/register")
        .send(validUser);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test("should fail validation (Zod) if email is invalid", async () => {
      const invalidUser = { ...validUser, email: "not-an-email" };

      const response = await request(app)
        .post("/api/user/register")
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    test("should fail if required fields are missing", async () => {
      const { email, ...incompleteUser } = validUser;

      const response = await request(app)
        .post("/api/user/register")
        .send(incompleteUser);

      expect(response.status).toBe(400);
      expect(response.body.errors.issues[0]).toHaveProperty("path", ["email"]);
    });

    test("should set role to Admin when isAdmin is true", async () => {
      const adminUser = { ...validUser, isAdmin: true };

      const response = await request(app)
        .post("/api/user/register")
        .send(adminUser);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe("Admin");
      expect(response.body.message).toBe("Admin registered successfully.");
    });
  });
});
