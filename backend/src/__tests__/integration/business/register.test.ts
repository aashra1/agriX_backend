import request from "supertest";
import mongoose from "mongoose";
import app from "../../../app";
import { Business } from "../../../model/business.model";

describe("Business Registration Tests", () => {
  const testBusiness = {
    businessName: "Green Grocers",
    email: "green@test.com",
    password: "Password123!",
    phoneNumber: "9800000000",
    address: "Kathmandu",
    category: "Retail",
  };

  afterAll(async () => {
    await Business.deleteMany({ email: testBusiness.email });
  });

  test("Should register a new business successfully", async () => {
    const res = await request(app)
      .post("/api/business/register")
      .send(testBusiness);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("tempToken");
  });

  test("Should fail to register business with existing email", async () => {
    await request(app).post("/api/business/register").send(testBusiness);
    const res = await request(app)
      .post("/api/business/register")
      .send(testBusiness);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Business already exists");
  });
});
