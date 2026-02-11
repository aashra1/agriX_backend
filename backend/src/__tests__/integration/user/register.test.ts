import request from "supertest";
import mongoose from "mongoose";
import { UserModel } from "../../../model/user.model";
import app from "../../../app";

describe("User Registration Integration Tests", () => {
  const validUser = {
    fullName: "Reg User",
    email: "reg@example.com",
    password: "Password@123",
    phoneNumber: "9800000000",
    address: "Kathmandu",
  };

  beforeAll(async () => {
    await UserModel.deleteMany({ email: validUser.email });
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: validUser.email });
  });

  test("should register successfully", async () => {
    const response = await request(app)
      .post("/api/user/register")
      .send(validUser);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test("should fail for duplicate email", async () => {
    await request(app).post("/api/user/register").send(validUser);
    const response = await request(app)
      .post("/api/user/register")
      .send(validUser);
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
