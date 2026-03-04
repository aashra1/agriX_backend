import { BusinessService } from "../../../services/business.service";
import { BusinessRepository } from "../../../repositories/business.repository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../../../repositories/business.repository");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("BusinessService Unit Tests", () => {
  let service: BusinessService;
  let mockRepo: jest.Mocked<BusinessRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BusinessService();
    mockRepo = new BusinessRepository() as jest.Mocked<BusinessRepository>;
    (service as any).businessRepository = mockRepo;
  });

  test("register - should create business with pending status", async () => {
    const dto = { email: "test@test.com", password: "pass" };
    mockRepo.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
    (jwt.sign as jest.Mock).mockReturnValue("token");
    mockRepo.createBusiness.mockResolvedValue({
      _id: "123",
      toObject: () => ({}),
    } as any);
    const result = await service.register(dto as any);
    expect(result.tempToken).toBe("token");
  });

  test("register - should throw if business exists", async () => {
    mockRepo.findByEmail.mockResolvedValue({ _id: "123" } as any);
    await expect(service.register({ email: "test" } as any)).rejects.toThrow(
      "Business already exists",
    );
  });

  test("login - should login approved business", async () => {
    const mockBusiness = {
      _id: "123",
      email: "test",
      password: "hashed",
      businessStatus: "Approved",
      toObject: () => ({ _id: "123" }),
    };
    mockRepo.findByEmail.mockResolvedValue(mockBusiness as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("token");
    const result = await service.login({ email: "test", password: "pass" });
    expect(result.token).toBe("token");
  });

  test("login - should throw if pending no doc", async () => {
    mockRepo.findByEmail.mockResolvedValue({
      businessStatus: "Pending",
      businessDocument: null,
    } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    await expect(
      service.login({ email: "test", password: "pass" }),
    ).rejects.toThrow("Please upload document");
  });

  test("uploadDocument - should update document", async () => {
    const mockBiz = {
      _id: "123",
      businessDocument: null,
      businessStatus: "Pending",
      save: jest.fn().mockResolvedValue({}),
    };
    mockRepo.getBusinessById.mockResolvedValue(mockBiz as any);
    mockRepo.save.mockResolvedValue(mockBiz as any);
    await service.uploadDocument("123", "doc.pdf");
    expect(mockBiz.businessDocument).toBe("doc.pdf");
  });

  test("approveBusiness - should approve business", async () => {
    const mockBiz = {
      _id: "123",
      businessStatus: "Pending",
      businessVerified: false,
      save: jest.fn().mockResolvedValue({}),
    };
    mockRepo.getBusinessById.mockResolvedValue(mockBiz as any);
    await service.approveBusiness("123", { action: "Approve" });
    expect(mockBiz.businessStatus).toBe("Approved");
  });
});
