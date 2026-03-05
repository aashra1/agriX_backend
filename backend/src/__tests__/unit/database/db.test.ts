import mongoose from "mongoose";
import connectDB from "../../../database/db";

jest.mock("mongoose");

describe("connectDB", () => {
  const originalEnv = process.env;
  const mockExit = jest
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);
  const mockConsoleError = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const mockConsoleLog = jest
    .spyOn(console, "log")
    .mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });

  test("should connect to database successfully when DB_URL is defined", async () => {
    process.env.DB_URL = "mongodb://localhost:27017/testdb";
    (mongoose.connect as jest.Mock).mockResolvedValue("connected");

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/testdb",
    );
    expect(mockConsoleLog).toHaveBeenCalledWith("Connected to Database");
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  test("should exit process if DB_URL is not defined", async () => {
    delete process.env.DB_URL;

    await connectDB();

    expect(mockConsoleError).toHaveBeenCalledWith(
      "FATAL ERROR: DB_URL is not defined.",
    );
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("should exit process if connection fails", async () => {
    process.env.DB_URL = "mongodb://localhost:27017/testdb";
    const error = new Error("Connection failed");
    (mongoose.connect as jest.Mock).mockRejectedValue(error);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/testdb",
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Database connection error:",
      error,
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
