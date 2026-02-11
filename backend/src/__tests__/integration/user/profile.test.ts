import request from "supertest";
import mongoose from "mongoose";
import app from "../../../app";
import { UserModel } from "../../../model/user.model";

const testUser = {
  fullName: "Profile User",
  email: "profile@example.com",
  password: "Password123!",
  phoneNumber: "9876543211",
  address: "Kathmandu",
};

describe("User Profile Integration Tests", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/testdb",
      );
    }
    await UserModel.deleteMany({ email: testUser.email });
    await request(app).post("/api/user/register").send(testUser);
    const loginRes = await request(app)
      .post("/api/user/login")
      .send({ email: testUser.email, password: testUser.password });
    authToken = loginRes.body.token;
    userId = loginRes.body.user._id;
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.connection.close();
  });

  test("GET /api/user/:userId should return profile", async () => {
    const response = await request(app)
      .get(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.profile.email).toBe(testUser.email);
  });

  test("PUT /api/user/:userId should update", async () => {
    const response = await request(app)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ fullName: "New Name" });
    expect(response.status).toBe(200);
    expect(response.body.updatedUser.fullName).toBe("New Name");
  });

  test("DELETE /api/user/:userId should remove user", async () => {
    const response = await request(app)
      .delete(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted");
  });
});
