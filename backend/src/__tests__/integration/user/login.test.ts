import request from "supertest";
import bcrypt from "bcrypt";
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
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    console.log("Created user with hashed password:", hashedPassword);

    await UserModel.create({
      fullName: testUser.fullName,
      email: testUser.email,
      password: hashedPassword,
      phoneNumber: testUser.phoneNumber,
      address: testUser.address,
    });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  describe("POST /api/user/login", () => {
    test("should log in the user successfully", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      console.log("Success response:", {
        status: response.status,
        body: response.body,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
    });

    test("should fail for wrong password", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      console.log("Wrong password response:", {
        status: response.status,
        body: response.body,
      });

      // If it's returning 200, let's check what's in the response
      if (response.status === 200) {
        console.log("Login succeeded with wrong password - this is a bug!");
        // Check if it's returning a token
        if (response.body.token) {
          console.log("Token was generated!");
        }
      }

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid credentials");
    });

    test("should fail to login user with empty fields", async () => {
      const response = await request(app).post("/api/user/login").send({});

      console.log("Empty fields response:", {
        status: response.status,
        body: response.body,
      });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});
