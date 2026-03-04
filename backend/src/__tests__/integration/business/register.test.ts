import request from "supertest";
import app from "../../../app";
import { Business } from "../../../model/business.model";

describe("Business Registration Tests", () => {
  const testBusiness = {
    businessName: "Green Grocers",
    email: "green@test.com",
    password: "Password123!",
    phoneNumber: "9800000000",
    address: "Kathmandu",
  };

  beforeEach(async () => {
    await Business.deleteMany({});
  });

  afterAll(async () => {
    await Business.deleteMany({});
  });

  test("Should register a new business successfully", async () => {
    const res = await request(app)
      .post("/api/business/register")
      .send(testBusiness);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("tempToken");
    expect(res.body.message).toBe(
      "Business registered successfully. Please upload your document.",
    );
  });

  test("should register a business with a profile picture", async () => {
    const response = await request(app)
      .post("/api/business/register")
      .field("businessName", "Green Garden")
      .field("email", "green@garden.com")
      .field("password", "Secure123!")
      .field("phoneNumber", "9841000000")
      .field("address", "Pokhara")
      .attach("profilePicture", Buffer.from("dummy image content"), {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty("tempToken");
  });

  test("should fail registration due to validation error (Invalid Email)", async () => {
    const invalidBusiness = { ...testBusiness, email: "invalid-email" };

    const response = await request(app)
      .post("/api/business/register")
      .send(invalidBusiness);

    expect(response.status).toBe(400);
    if (response.body.success !== undefined) {
      expect(response.body.success).toBe(false);
    }
    expect(JSON.stringify(response.body).toLowerCase()).toContain("email");
  });

  test("should fail if required fields are missing", async () => {
    const { businessName, ...incompleteData } = testBusiness;

    const response = await request(app)
      .post("/api/business/register")
      .send(incompleteData);

    expect(response.status).toBe(400);
    if (response.body.success !== undefined) {
      expect(response.body.success).toBe(false);
    }
    expect(JSON.stringify(response.body).toLowerCase()).toContain(
      "businessname",
    );
  });

  test("should fail to register business with existing email", async () => {
    await request(app).post("/api/business/register").send(testBusiness);

    const response = await request(app)
      .post("/api/business/register")
      .send(testBusiness);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Business already exists");
  });
});
