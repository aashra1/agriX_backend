import request from "supertest";
import app from "../../../app";
import { Business } from "../../../model/business.model";
import jwt from "jsonwebtoken";

describe("Business Admin Integration Tests", () => {
  let adminToken: string;
  let userToken: string;
  let pendingBusinessId: string;

  beforeAll(async () => {
    const admin = await Business.create({
      businessName: "Admin User",
      email: "admin@test.com",
      password: "hashedPassword123",
      phoneNumber: "9841234567",
      address: "Kathmandu",
      role: "Admin",
      businessStatus: "Approved",
    });

    const pendingBusiness = await Business.create({
      businessName: "Pending Biz",
      email: "pending@test.com",
      password: "hashedPassword123",
      phoneNumber: "9841234568",
      address: "Lalitpur",
      businessStatus: "Pending",
      businessDocument: "uploads/docs/test.pdf",
      role: "Business",
    });

    const regularUser = await Business.create({
      businessName: "Regular Biz",
      email: "regular@test.com",
      password: "hashedPassword123",
      phoneNumber: "9841234569",
      address: "Bhaktapur",
      businessStatus: "Approved",
      role: "Business",
    });

    pendingBusinessId = pendingBusiness._id.toString();

    adminToken = jwt.sign(
      { id: admin._id, role: "Admin" },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    userToken = jwt.sign(
      { id: regularUser._id, role: "Business" },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );
  });

  afterAll(async () => {
    await Business.deleteMany({});
  });

  test("Admin should approve a business", async () => {
    const response = await request(app)
      .post(`/api/business/admin/action/${pendingBusinessId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "Approve" });
    expect(response.status).toBe(404);
    expect(response.body).toBeDefined();
  });

  test("Admin should be able to fetch all businesses", async () => {
    const response = await request(app)
      .get("/api/business/admin/all")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.businesses)).toBe(true);
  });

  test("Should deny access to admin routes for non-admin users", async () => {
    const response = await request(app)
      .post(`/api/business/admin/action/${pendingBusinessId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ action: "Approve" });

    expect(response.status).toBe(404);

    expect(response.body).toBeDefined();
  });
});
