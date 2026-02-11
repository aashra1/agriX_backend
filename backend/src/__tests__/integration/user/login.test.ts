import request from "supertest";
import bcrypt from "bcrypt";
import { UserModel } from "../../../model/user.model";
import app from "../../../app";

const testUser = {
  fullName: "Test Login User",
  email: "test_login@example.com",
  password: "test@1234",
  phoneNumber: "9876543210",
  address: "Kathmandu",
};

describe("User Login Integration Tests", () => {
  beforeAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await UserModel.create({
      ...testUser,
      password: hashedPassword,
      role: "User",
      isAdmin: false,
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  describe("POST /api/user/login", () => {
    test("should log in the user successfully and return a token", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("email", testUser.email);
    });

    test("should fail for wrong password with 401 status", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid credentials");
    });

    test("should fail to login with empty body and return 400 (validation error)", async () => {
      const response = await request(app).post("/api/user/login").send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    test("should fail for a non-existent email", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: "nonexistent@test.com",
        password: "password123",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
