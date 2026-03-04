import request from "supertest";
import app from "../../../app";
import { Business } from "../../../model/business.model";
import jwt from "jsonwebtoken";

describe("Business Document Upload Tests", () => {
  let tempToken: string;
  let businessId: string;

  beforeAll(async () => {
    const business = await Business.create({
      businessName: "Document Upload Biz",
      email: "document@test.com",
      password: "hashedPassword123",
      phoneNumber: "9841234567",
      address: "Lalitpur",
      businessStatus: "Pending",
      role: "Business",
    });

    businessId = business._id.toString();

    tempToken = jwt.sign(
      { id: businessId, role: "Business", temp: true },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );
  });

  afterAll(async () => {
    await Business.deleteMany({ email: "document@test.com" });
  });

  test("Should upload business verification document successfully", async () => {
    const response = await request(app)
      .post("/api/business/upload-document")
      .set("Authorization", `Bearer ${tempToken}`)
      .attach("document", Buffer.from("dummy pdf content"), {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Document uploaded");
  });

  test("Should fail upload if no file is provided", async () => {
    const response = await request(app)
      .post("/api/business/upload-document")
      .set("Authorization", `Bearer ${tempToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("No document uploaded");
  });
});
