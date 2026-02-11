import request from "supertest";
import app from "../../../app";
import { Category } from "../../../model/category.model";
import jwt from "jsonwebtoken";

describe("Category Integration Suite", () => {
  let adminToken: string;
  let categoryId: string;

  beforeAll(async () => {
    adminToken = jwt.sign(
      { role: "Admin", isAdmin: true },
      process.env.JWT_SECRET!,
    );
  });

  afterAll(async () => {
    await Category.deleteMany({});
  });

  test("POST /api/categories - Should create category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Fruits", description: "Fresh fruits" });

    expect(res.status).toBe(201);
    categoryId = res.body.category._id;
  });

  test("GET /api/categories - Should list all categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
