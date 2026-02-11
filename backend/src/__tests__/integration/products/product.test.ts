import request from "supertest";
import mongoose from "mongoose";
import { ProductModel } from "../../../model/product.model";
import { Category } from "../../../model/category.model";
import jwt from "jsonwebtoken";
import app from "../../..";

describe("Product Integration Tests", () => {
  let authToken: string;
  let businessId: string;
  let categoryId: string;
  let productId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/testdb",
      );
    }

    const category = await Category.create({
      name: "Vegetables",
      description: "Fresh ones",
    });
    categoryId = (category._id as any).toString();

    businessId = new mongoose.Types.ObjectId().toString();
    authToken = jwt.sign(
      { id: businessId, role: "Business" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" },
    );
  });

  afterAll(async () => {
    await ProductModel.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  describe("POST /api/product", () => {
    test("should add a product successfully", async () => {
      const response = await request(app)
        .post("/api/product")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Organic Tomato",
          category: categoryId,
          price: 100,
          stock: 50,
          description: "Fresh from the farm",
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.product.name).toBe("Organic Tomato");
      productId = response.body.product._id;
    });

    test("should fail if required fields are missing", async () => {
      const response = await request(app)
        .post("/api/product")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Incomplete Product" }); 

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("required");
    });
  });

  describe("GET /api/product/business", () => {
    test("should fetch products belonging to the business", async () => {
      const response = await request(app)
        .get("/api/product/business")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/product/:id", () => {
    test("should update product details", async () => {
      const response = await request(app)
        .patch(`/api/product/${productId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ price: 150 });

      expect(response.status).toBe(200);
      expect(response.body.product.price).toBe(150);
    });

    test("should fail if unauthorized user tries to update", async () => {
      const wrongToken = jwt.sign({ id: "wrongid" }, "secret");

      const response = await request(app)
        .patch(`/api/product/${productId}`)
        .set("Authorization", `Bearer ${wrongToken}`)
        .send({ price: 500 });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Access denied");
    });
  });

  describe("DELETE /api/product/:id", () => {
    test("should delete the product", async () => {
      const response = await request(app)
        .delete(`/api/product/${productId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Product deleted successfully");
    });
  });
});
