import request from "supertest";
import app from "../../../app";
import { Business } from "../../../model/business.model";
import bcrypt from "bcrypt";

describe("Business Login Integration", () => {
  const loginCredentials = {
    email: "loginbiz@test.com",
    password: "Password123!",
  };

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(loginCredentials.password, 10);
    await Business.create({
      businessName: "Login Test Biz",
      email: loginCredentials.email,
      password: hashedPassword,
      phoneNumber: "9841234567",
      address: "Lalitpur",
      category: "Wholesale",
      businessStatus: "Approved",
      businessDocument: "uploads/docs/test.pdf",
      role: "Business",
    });
  });

  afterAll(async () => {
    await Business.deleteMany({ email: loginCredentials.email });
  });

  test("POST /api/business/login - Should log in successfully and return a token", async () => {
    const res = await request(app).post("/api/business/login").send({
      email: loginCredentials.email,
      password: loginCredentials.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("token");
    expect(res.body.message).toBe("Business logged in successfully");
  });

  test("Extra: POST /api/business/login - Should fail with incorrect password", async () => {
    const res = await request(app).post("/api/business/login").send({
      email: loginCredentials.email,
      password: "WrongPassword123",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid credentials");
  });
});
