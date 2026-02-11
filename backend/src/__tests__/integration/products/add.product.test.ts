import request from "supertest";
import app from "../../../app";
import { Product } from "../../../model/product.model";
import { Category } from "../../../model/category.model";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

describe("Product Creation Tests", () => {
  let bizToken: string;
  let catId: string;

  beforeAll(async () => {
    bizToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "Business" },
      process.env.JWT_SECRET!,
    );
    const cat = await Category.create({
      name: "Add Test",
      description: "Desc",
    });
    catId = cat._id.toString();
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  test("Should add product successfully with valid data", async () => {
    const res = await request(app)
      .post("/api/product")
      .set("Authorization", `Bearer ${bizToken}`)
      .send({ name: "Fresh Apple", category: catId, price: 100, stock: 10 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test("Should fail to add product if fields are missing", async () => {
    const res = await request(app)
      .post("/api/product")
      .set("Authorization", `Bearer ${bizToken}`)
      .send({ name: "Incomplete Product" }); // Missing price/category/stock
    expect(res.status).toBe(400);
  });
});
