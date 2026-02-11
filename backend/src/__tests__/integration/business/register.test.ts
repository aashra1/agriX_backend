import request from "supertest";
import mongoose from "mongoose";
import app from "../../../app";
import { Business } from "../../../model/business.model";

describe("Business Registration Integration Tests", () => {
  const validBusiness = {
    businessName: "Agrix Farm",
    email: "farm@agrix.com",
    password: "Password@123",
    phoneNumber: "9812345678",
    address: "Chitwan, Nepal",
    businessType: "Supplier",
    ownerName: "John Doe",
  };

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

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/business/register", () => {
    test("should register a business successfully without profile picture", async () => {
      const response = await request(app)
        .post("/api/business/register")
        .send(validBusiness);

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
  });
});
