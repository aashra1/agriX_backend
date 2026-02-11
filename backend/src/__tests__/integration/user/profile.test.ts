import request from "supertest";
import { UserModel } from "../../../model/user.model";
import app from "../../../app";

describe("User Profile Integration Tests", () => {
  let authToken!: string;
  let userId!: string;

  const testUser = {
    fullName: "Profile User",
    email: "profile@example.com",
    password: "Password123!",
    phoneNumber: "9876543211",
    address: "Kathmandu",
  };

  beforeAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });

    await request(app).post("/api/user/register").send(testUser);

    const loginRes = await request(app)
      .post("/api/user/login")
      .send({ email: testUser.email, password: testUser.password });

    authToken = loginRes.body.token;
    userId = (loginRes.body.user._id as any).toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  test("GET /api/user/:userId should return profile", async () => {
    const response = await request(app)
      .get(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.profile.email).toBe(testUser.email);
  });

  test("PUT /api/user/:userId should update profile details", async () => {
    const response = await request(app)
      .put(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ fullName: "Updated Name" });

    expect(response.status).toBe(200);
    expect(response.body.updatedUser.fullName).toBe("Updated Name");
  });

  test("DELETE /api/user/:userId should remove user account", async () => {
    const response = await request(app)
      .delete(`/api/user/${userId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted");
  });

  test("GET /api/user/:userId should fail without token", async () => {
    const response = await request(app).get(`/api/user/${userId}`);
    expect(response.status).toBe(401);
  });
});
