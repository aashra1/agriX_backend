import request from "supertest";
import app from "../../../app";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Business } from "../../../model/business.model";

describe("Business Document Upload Tests", () => {
  let tempToken!: string;
  let bizId!: string;

  beforeAll(async () => {
    const biz = await Business.create({
      businessName: "Doc Test Biz",
      email: "docs@test.com",
      password: "hashedpassword",
      phoneNumber: "9811111111",
      address: "Patan",
      category: "Service",
    });

    bizId = (biz._id as any).toString();

    tempToken = jwt.sign(
      { id: bizId, role: "Business", temp: true },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );
  });

  afterAll(async () => {
    if (bizId) {
      await Business.deleteOne({ _id: bizId });
    }
  });

  test("Should upload business verification document successfully", async () => {
    const res = await request(app)
      .post("/api/business/upload-document")
      .set("Authorization", `Bearer ${tempToken}`)
      .attach("document", Buffer.from("fake-pdf-content"), "license.pdf");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Document uploaded");
  });

  test("Should fail upload if no file is provided", async () => {
    const res = await request(app)
      .post("/api/business/upload-document")
      .set("Authorization", `Bearer ${tempToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No document uploaded");
  });
});
