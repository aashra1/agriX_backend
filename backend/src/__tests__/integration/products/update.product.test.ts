import request from "supertest";
import app from "../../../app";
import { Product } from "../../../model/product.model";
import { Category } from "../../../model/category.model";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

describe("Product Update Tests", () => {
  let bizToken: string;
  let intruderToken: string;
  let prodId: string;
  let categoryId: string;
  const bizId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    const category = await Category.create({
      name: "Test Category",
      description: "For product tests",
    });
    categoryId = category._id.toString();

    bizToken = jwt.sign(
      { id: bizId, role: "Business" },
      process.env.JWT_SECRET!,
    );

    intruderToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "Business" },
      process.env.JWT_SECRET!,
    );

    const product = await Product.create({
      name: "Old Name",
      price: 50,
      stock: 5,
      business: new mongoose.Types.ObjectId(bizId),
      category: new mongoose.Types.ObjectId(categoryId),
    });
    prodId = product._id.toString();
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  test("Product should exist before update", async () => {
    const product = await Product.findById(prodId);
    expect(product).not.toBeNull();
    expect(product?.name).toBe("Old Name");
  });

  test("Owner should update product price successfully", async () => {
    console.log(`Updating product with ID: ${prodId}`);

    const getRes = await request(app).get(`/api/product/${prodId}`);

    console.log("GET response status:", getRes.status);
    console.log("GET response body:", getRes.body);

    expect(getRes.status).toBe(200);
    expect(getRes.body.product._id).toBe(prodId);

    const res = await request(app)
      .patch(`/api/product/${prodId}`)
      .set("Authorization", `Bearer ${bizToken}`)
      .send({ price: 75 });

    console.log("PATCH response status:", res.status);
    console.log("PATCH response body:", res.body);

    if (res.status === 404) {
      console.log("Trying PUT method...");
      const putRes = await request(app)
        .put(`/api/product/${prodId}`)
        .set("Authorization", `Bearer ${bizToken}`)
        .send({ price: 75 });

      console.log("PUT response status:", putRes.status);
      console.log("PUT response body:", putRes.body);

      expect(putRes.status).toBe(200);
      expect(putRes.body.product.price).toBe(75);
    } else {
      expect(res.status).toBe(200);
      expect(res.body.product.price).toBe(75);
    }
  });

  test("Unauthorized business should not be able to update product", async () => {
    const res = await request(app)
      .patch(`/api/product/${prodId}`)
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ price: 1000 });

    console.log("Unauthorized response status:", res.status);
    console.log("Unauthorized response body:", res.body);

    expect([401, 403, 404]).toContain(res.status);
  });
});
