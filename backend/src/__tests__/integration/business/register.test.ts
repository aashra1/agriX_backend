import request from "supertest";
import app from "../../../app";
import { Business } from "../../../model/business.model";

describe("Business Registration Integration Tests", () => {
  const validBusiness = {
    businessName: "Agrix Farm",
    email: "farm@agrix.com",
    password: "Password@123",
    phoneNumber: "9812345678",
    address: "Chitwan, Nepal",
  };

  beforeAll(async () => {
    await Business.deleteMany({
      email: { $in: [validBusiness.email, "green@garden.com"] },
    });
  });

  afterEach(async () => {
    await Business.deleteMany({
      email: { $in: [validBusiness.email, "green@garden.com"] },
    });
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
    });


    test("should fail registration due to Zod validation error for invalid email", async () => {
      const invalidBusiness = { ...validBusiness, email: "not-an-email" };

      const response = await request(app)
        .post("/api/business/register")
        .send(invalidBusiness);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    test("should fail if businessName is missing", async () => {
      const { businessName, ...incompleteData } = validBusiness;

      const response = await request(app)
        .post("/api/business/register")
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    test("should return 400 when attempting to register a duplicate email", async () => {
      await request(app).post("/api/business/register").send(validBusiness);

      const response = await request(app)
        .post("/api/business/register")
        .send(validBusiness);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Business already exists");
    });
  });
});
