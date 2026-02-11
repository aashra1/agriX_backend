import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { UserModel } from "../../../model/user.model";
import app from "../../../app";

describe("Auth Token Validity", () => {
  let expiredToken: string;
  let userId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/testdb",
      );
    }
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
    await UserModel.deleteMany({});
    await mongoose.connection.close();
  });

  test("should reject expired token", async () => {
    const response = await request(app)
      .get(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token!");
  });
});
