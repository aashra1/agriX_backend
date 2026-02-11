import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

jest.setTimeout(30000);

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log(`TEST ENV ACTIVE | DB: ${mongoose.connection.name}`);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});
