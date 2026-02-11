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

<<<<<<< HEAD
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/testdb",
      );
    }
  });

  afterEach(async () => {
    await Business.deleteMany({});
  });

=======
>>>>>>> 38b956dd041565fa8c9ce76efabd3b4977ddae55
  afterAll(async () => {
    await Business.deleteMany({ email: testBusiness.email });
  });

  test("Should register a new business successfully", async () => {
    const res = await request(app)
      .post("/api/business/register")
      .send(testBusiness);

<<<<<<< HEAD
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.business).toHaveProperty(
        "businessName",
        validBusiness.businessName,
      );
      expect(response.body.business.email).toBe(validBusiness.email);
    });

    test("should register a business with a profile picture (Multer Mock)", async () => {
      const response = await request(app)
        .post("/api/business/register")
        .field("businessName", "Green Garden")
        .field("email", "green@garden.com")
        .field("password", "Secure123!")
        .field("phoneNumber", "9841000000")
        .field("address", "Pokhara")
        .field("businessType", "Retailer")
        .field("ownerName", "Jane Smith")
        .attach("image", Buffer.from("dummy"), "test.jpg");

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test("should fail registration due to Zod validation error (Invalid Email)", async () => {
      const invalidBusiness = { ...validBusiness, email: "invalid-email" };

      const response = await request(app)
        .post("/api/business/register")
        .send(invalidBusiness);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).toContain("email");
    });

    test("should fail if required fields are missing", async () => {
      const { businessName, ...incompleteData } = validBusiness;

      const response = await request(app)
        .post("/api/business/register")
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).toContain("businessName");
    });

    test("should catch service-level errors (e.g., Duplicate Email)", async () => {
      await request(app).post("/api/business/register").send(validBusiness);

      const response = await request(app)
        .post("/api/business/register")
        .send(validBusiness);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty("message");
    });
=======
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
>>>>>>> 38b956dd041565fa8c9ce76efabd3b4977ddae55
  });
});
