import { Types } from "mongoose";
import { BusinessRepository } from "../../../../repositories/business.repository";
import { Business } from "../../../../model/business.model";

jest.mock("../../../../model/business.model");

describe("BusinessRepository Unit Tests", () => {
  let repository: BusinessRepository;
  let mockBusinessModel: jest.Mocked<typeof Business>;

  const mockBusinessDoc = (overrides: any = {}) => {
    const base = {
      _id: overrides._id ?? new Types.ObjectId("507f1f77bcf86cd799439011"),
      businessName: overrides.businessName ?? "Test Business",
      email: overrides.email ?? "test@business.com",
      phoneNumber: overrides.phoneNumber ?? "1234567890",
      password: overrides.password ?? "hashedPass",
      address: overrides.address ?? "Test Address",
      profilePicture: overrides.profilePicture ?? "profile.jpg",
      businessDocument: overrides.businessDocument ?? null,
      businessVerified: overrides.businessVerified ?? false,
      businessStatus: overrides.businessStatus ?? "Pending",
      rejectionReason: overrides.rejectionReason ?? undefined,
      role: "Business",
    };

    const doc = {
      ...base,
      ...overrides,
      save: jest.fn().mockResolvedValue({
        ...base,
        ...overrides,
      }),
    };

    return doc;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new BusinessRepository();
    mockBusinessModel = Business as jest.Mocked<typeof Business>;
  });

  describe("getAllBusinesses", () => {
    test("should return all businesses with pagination", async () => {
      const mockBusinesses = [
        mockBusinessDoc({ _id: "biz1", businessName: "Business 1" }),
        mockBusinessDoc({ _id: "biz2", businessName: "Business 2" }),
      ];

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBusinesses),
      };

      (Business.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.getAllBusinesses(5, 10);

      expect(Business.find).toHaveBeenCalled();
      expect(mockQuery.skip).toHaveBeenCalledWith(5);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockBusinesses);
      expect(result).toHaveLength(2);
    });

    test("should use default pagination values", async () => {
      const mockBusinesses = [mockBusinessDoc()];

      const mockQuery = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockBusinesses),
      };

      (Business.find as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.getAllBusinesses();

      expect(Business.find).toHaveBeenCalled();
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockBusinesses);
    });
  });

  describe("getBusinessById", () => {
    test("should return business by id", async () => {
      const businessId = "507f1f77bcf86cd799439011";
      const mockBusiness = mockBusinessDoc({ _id: businessId });

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockBusiness),
      };

      (Business.findById as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.getBusinessById(businessId);

      expect(Business.findById).toHaveBeenCalledWith(businessId);
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockBusiness);
    });

    test("should return null if business not found", async () => {
      const businessId = "507f1f77bcf86cd799439011";

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (Business.findById as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.getBusinessById(businessId);

      expect(Business.findById).toHaveBeenCalledWith(businessId);
      expect(result).toBeNull();
    });
  });

  describe("getBusinessByEmail", () => {
    test("should return business by email", async () => {
      const email = "test@business.com";
      const mockBusiness = mockBusinessDoc({ email });

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockBusiness),
      };

      (Business.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.getBusinessByEmail(email);

      expect(Business.findOne).toHaveBeenCalledWith({ email });
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockBusiness);
    });

    test("should return null if business not found by email", async () => {
      const email = "nonexistent@business.com";

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (Business.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.getBusinessByEmail(email);

      expect(Business.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    test("should return business by email (alias method)", async () => {
      const email = "test@business.com";
      const mockBusiness = mockBusinessDoc({ email });

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockBusiness),
      };

      (Business.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.findByEmail(email);

      expect(Business.findOne).toHaveBeenCalledWith({ email });
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(mockBusiness);
    });

    test("should return null if business not found by email", async () => {
      const email = "nonexistent@business.com";

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (Business.findOne as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.findByEmail(email);

      expect(Business.findOne).toHaveBeenCalledWith({ email });
      expect(result).toBeNull();
    });
  });

  describe("createBusiness", () => {
    test("should create a new business", async () => {
      const businessData = {
        businessName: "New Business",
        email: "new@business.com",
        password: "hashedPass",
      };

      const mockCreatedBusiness = mockBusinessDoc({
        ...businessData,
        _id: "newbiz123",
      });

      // Mock the Business constructor
      const mockSave = jest.fn().mockResolvedValue(mockCreatedBusiness);
      (Business as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.createBusiness(businessData);

      expect(Business).toHaveBeenCalledWith(businessData);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedBusiness);
    });
  });

  describe("updateBusiness", () => {
    test("should update business successfully", async () => {
      const businessId = "507f1f77bcf86cd799439011";
      const updateData = {
        businessName: "Updated Name",
        phoneNumber: "9876543210",
      };

      const updatedBusiness = mockBusinessDoc({
        _id: businessId,
        ...updateData,
      });

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(updatedBusiness),
      };

      (Business.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.updateBusiness(businessId, updateData);

      expect(Business.findByIdAndUpdate).toHaveBeenCalledWith(
        businessId,
        { $set: updateData },
        { new: true },
      );
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(updatedBusiness);
    });

    test("should return null if business to update not found", async () => {
      const businessId = "nonexistent123";
      const updateData = { businessName: "Updated Name" };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (Business.findByIdAndUpdate as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.updateBusiness(businessId, updateData);

      expect(Business.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("deleteBusiness", () => {
    test("should delete business successfully", async () => {
      const businessId = "507f1f77bcf86cd799439011";
      const deletedBusiness = mockBusinessDoc({ _id: businessId });

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(deletedBusiness),
      };

      (Business.findByIdAndDelete as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.deleteBusiness(businessId);

      expect(Business.findByIdAndDelete).toHaveBeenCalledWith(businessId);
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual(deletedBusiness);
    });

    test("should return null if business to delete not found", async () => {
      const businessId = "nonexistent123";

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      (Business.findByIdAndDelete as jest.Mock).mockReturnValue(mockQuery);

      const result = await repository.deleteBusiness(businessId);

      expect(Business.findByIdAndDelete).toHaveBeenCalledWith(businessId);
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    test("should save an existing business document", async () => {
      const businessDoc = mockBusinessDoc({ _id: "biz123" });
      const savedDoc = { ...businessDoc, businessName: "Saved" };

      businessDoc.save = jest.fn().mockResolvedValue(savedDoc);

      const result = await repository.save(businessDoc as any);

      expect(businessDoc.save).toHaveBeenCalled();
      expect(result).toEqual(savedDoc);
    });
  });
});
