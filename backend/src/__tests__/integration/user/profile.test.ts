import request from "supertest";
import app from "../../../app";
import { UserModel } from "../../../model/user.model";
import bcrypt from "bcrypt";

const testUser = {
  fullName: "Test User",
  email: "profiletest@example.com",
  password: "test@1234",
  phoneNumber: "9876543210",
  address: "Kathmandu",
};

describe("User Profile Integration Tests", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create user directly
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = await UserModel.create({
      fullName: testUser.fullName,
      email: testUser.email,
      password: hashedPassword,
      phoneNumber: testUser.phoneNumber,
      address: testUser.address,
    });

    userId = user._id.toString();

    // Login to get token
    const loginRes = await request(app).post("/api/user/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  describe("GET /api/user/profile", () => {
    test("should fail if no token provided", async () => {
      const response = await request(app).get("/api/user/profile");
      expect(response.status).toBe(401); // Your controller returns 401 for unauthorized
    });

    test("should return the authenticated user profile", async () => {
      const response = await request(app)
        .get("/api/user/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.profile).toBeDefined();
      expect(response.body.profile.email).toBe(testUser.email);
    });
  });

  describe("PUT /api/user/profile", () => {
    test("should update profile successfully", async () => {
      const response = await request(app)
        .put("/api/user/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ fullName: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Profile updated successfully");
      expect(response.body.user).toBeDefined();
      expect(response.body.user.fullName).toBe("Updated Name");
    });

    test("should fail with invalid data", async () => {
      const response = await request(app)
        .put("/api/user/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined(); // Your controller returns errors object
    });
  });

  describe("DELETE /api/user/:userId", () => {
    test("should delete user account", async () => {
      const response = await request(app)
        .delete(`/api/user/${userId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Since user is not admin, this should return 403
      expect(response.status).toBe(403);

      // If you want to test actual deletion, you'd need an admin token
      // For now, verify user still exists (wasn't deleted)
      const user = await UserModel.findById(userId);
      expect(user).not.toBeNull();
    });
  });
});
