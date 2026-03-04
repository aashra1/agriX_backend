import request from "supertest";
import app from "../../../app";
import { Product } from "../../../model/product.model";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

describe("Product Deletion Tests", () => {
  let bizToken: string;
  let prodId: string;
  const bizId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    bizToken = jwt.sign(
      { id: bizId, role: "Business" },
      process.env.JWT_SECRET!,
    );
    const product = await Product.create({
      name: "To Be Deleted",
      price: 10,
      stock: 1,
      business: bizId,
      category: new mongoose.Types.ObjectId(),
    });
    prodId = product._id.toString();
  });

  afterAll(async () => {
    await Product.deleteMany({});
  });

  test("Owner should delete product successfully", async () => {
    const res = await request(app)
      .delete(`/api/product/${prodId}`)
      .set("Authorization", `Bearer ${bizToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("deleted");
  });

  test("Should return 404 for deleting non-existent product", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/product/${fakeId}`)
      .set("Authorization", `Bearer ${bizToken}`);
    expect(res.status).toBe(404);
  });
});
