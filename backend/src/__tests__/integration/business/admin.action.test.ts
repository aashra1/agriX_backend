import request from "supertest";
import app from "../../../app";
import jwt from "jsonwebtoken";
import { Business } from "../../../model/business.model";

describe("Business Admin Integration Tests", () => {
  let adminToken: string;
  let businessId!: string;

  beforeAll(async () => {
    adminToken = jwt.sign(
      { id: "admin_id", role: "Admin", isAdmin: true },
      process.env.JWT_SECRET!,
    );

    const biz = await Business.create({
      businessName: "Pending Biz",
      email: "pending@test.com",
      password: "password",
      phoneNumber: "9822222222",
      address: "Bhaktapur",
      category: "Retail",
      businessStatus: "Pending",
    });

    businessId = (biz._id as any).toString();
  });

  afterAll(async () => {
    await Business.deleteMany({ email: "pending@test.com" });
  });

  test("Admin should approve a business", async () => {
    const res = await request(app)
      .put(`/api/business/admin/approve/${businessId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ action: "Approve" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.businessStatus).toBe("Approved");
  });

  test("Admin should be able to fetch all businesses", async () => {
    const res = await request(app)
      .get("/api/business/admin/all")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.businesses)).toBe(true);
  });

  test("Should deny access to admin routes for non-admin users", async () => {
    const userToken = jwt.sign(
      { id: "user_id", role: "User", isAdmin: false },
      process.env.JWT_SECRET!,
    );

    const res = await request(app)
      .get("/api/business/admin/all")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
