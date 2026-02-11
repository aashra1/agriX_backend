import request from "supertest";
import jwt from "jsonwebtoken";
import { UserModel } from "../../../model/user.model";
import app from "../../../app";

describe("Auth Token Validity Integration Tests", () => {
  let expiredToken!: string;
  let userId!: string;

  beforeAll(async () => {
    await UserModel.deleteMany({ email: "token@test.com" });

    const user = await UserModel.create({
      fullName: "Token User",
      email: "token@test.com",
      password: "password",
      phoneNumber: "1234567890",
      address: "Test",
    });

    userId = (user._id as any).toString();

    expiredToken = jwt.sign(
      { id: userId, role: "User" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "-1h" },
    );
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: "token@test.com" });
  });

  test("should reject an expired token with 401 status", async () => {
    const response = await request(app)
      .get(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token!");
  });

  test("should reject a token with an invalid signature", async () => {
    const invalidToken = jwt.sign(
      { id: userId, role: "User" },
      "wrong-secret-key",
    );

    const response = await request(app)
      .get(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
  });

  test("should reject requests with no token provided", async () => {
    const response = await request(app).get(`/api/user/${userId}`);

    expect(response.status).toBe(401);
  });
});
