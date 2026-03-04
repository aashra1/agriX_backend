import request from "supertest";
import app from "../../../app";
import { Product } from "../../../model/product.model";
import { Category } from "../../../model/category.model";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

describe("Product Get Tests", () => {
  let bizToken: string;
  let bizId: string;
  let catId: string;
  let productId: string;

  beforeAll(async () => {
    bizId = new mongoose.Types.ObjectId().toString();
    bizToken = jwt.sign(
      { id: bizId, role: "Business" },
      process.env.JWT_SECRET!,
    );

    const category = await Category.create({
      name: "Get Test Category",
      description: "For testing get endpoints",
    });
    catId = category._id.toString();

    const product = await Product.create({
      name: "Get Test Product",
      price: 100,
      stock: 10,
      business: bizId,
      category: catId,
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  test("Should get business products", async () => {
    const res = await request(app)
      .get("/api/product/business")
      .set("Authorization", `Bearer ${bizToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  test("Should get product by ID", async () => {
    const res = await request(app).get(`/api/product/${productId}`);

    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe("Get Test Product");
  });

  test("Should return 404 for non-existent product", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/product/${fakeId}`);

    expect(res.status).toBe(404);
  });
});
