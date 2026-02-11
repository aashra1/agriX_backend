import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import dotenv from "dotenv";
import { UserModel } from "../../../model/user.model";
import app from "../../..";

dotenv.config({ path: ".env.test" });

const testUser = {
  email: "expiry-test@example.com",
  password: "test@1234",
  username: "expiryUser",
  fullName: "Expiry Test User",
  phoneNumber: "9876543210",
  address: "Kathmandu",
};

describe("Auth Token Expiry and Validity", () => {
  let userId: string;
  let expiredToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI ||
          "mongodb+srv://aashrapandey00:123PAssword@cluster0.0h1b7iy.mongodb.net/",
      );
    }

    await UserModel.deleteMany({ email: testUser.email });
    const user = await UserModel.create(testUser);
    userId = user._id.toString();

    expiredToken = jwt.sign(
      { id: userId, role: user.role, isAdmin: user.isAdmin },
      process.env.JWT_SECRET as string,
      { expiresIn: "-1h" },
    );
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
  });

  test("should reject requests with an expired token", async () => {
    const response = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);

    expect(response.body.message).toMatch(/expired|invalid/i);
  });

  test("should fail if token is invalid or malformed", async () => {
    const response = await request(app)
      .get("/api/user/me")
      .set("Authorization", "Bearer not.a.real.token");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
