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

  test("5. POST /api/categories - Should create category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Fruits", description: "Fresh fruits" });

    expect(res.status).toBe(201);
    categoryId = res.body.category._id;
  });

  test("6. GET /api/categories - Should list all categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("7. GET /api/categories/:id - Should get specific category", async () => {
    const res = await request(app).get(`/api/categories/${categoryId}`);
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe("Fruits");
  });

  test("8. PUT /api/categories/:id - Should update category", async () => {
    const res = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Fresh and Organic" });

    expect(res.status).toBe(200);
    expect(res.body.category.description).toBe("Fresh and Organic");
  });

  test("9. DELETE /api/categories/:id - Should delete category", async () => {
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
