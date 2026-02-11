import request from "supertest";
import app from "../../../app";
import { Product } from "../../../model/product.model";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

describe("Product Update Tests", () => {
  let bizToken: string;
  let prodId: string;
  const bizId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    bizToken = jwt.sign(
      { id: bizId, role: "Business" },
      process.env.JWT_SECRET!,
    );
    const product = await Product.create({
      name: "Old Name",
      price: 50,
      stock: 5,
      business: bizId,
      category: new mongoose.Types.ObjectId(),
    });
    prodId = product._id.toString();
  });

  test("Owner should update product price successfully", async () => {
    const res = await request(app)
      .put(`/api/product/${prodId}`)
      .set("Authorization", `Bearer ${bizToken}`)
      .send({ price: 75 });
    expect(res.status).toBe(200);
    expect(res.body.product.price).toBe(75);
  });

  test("Unauthorized business should not be able to update product", async () => {
    const intruderToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "Business" },
      process.env.JWT_SECRET!,
    );
    const res = await request(app)
      .put(`/api/product/${prodId}`)
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ price: 1000 });
    expect(res.status).toBe(403);
  });
});
