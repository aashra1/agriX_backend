import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config({ path: ".env.test" });

if (!process.env.NODE_ENV || process.env.NODE_ENV !== "test") {
  throw new Error("Tests are trying to run outside of the test environment!");
}

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);
  console.log(
    `TEST ENV ACTIVE | DB: ${mongoose.connection.name} | URI: ${uri}`,
  );
}, 30000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
  console.log("Test database dropped and connection closed.");
}, 30000);
