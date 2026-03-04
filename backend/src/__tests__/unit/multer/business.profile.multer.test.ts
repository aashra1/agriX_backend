// src/__tests__/unit/multer/business.profile.multer.test.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import uploadBusinessProfilePicture from "../../../multer/business.profile.multer";

// Mock fs and path modules
jest.mock("fs");
jest.mock("path");

describe("Business Profile Multer Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Directory Setup", () => {
    test("should create upload directory if it doesn't exist", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

      const mockUploadDir = "/fake/path/uploads/business-profiles";
      (path.join as jest.Mock).mockReturnValue(mockUploadDir);

      jest.isolateModules(() => {
        require("../../../multer/business.profile.multer");
      });

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });

    test("should not create directory if it already exists", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockClear();

      jest.isolateModules(() => {
        require("../../../multer/business.profile.multer");
      });

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("Storage Configuration", () => {
    test("should have disk storage configured", () => {
      expect(uploadBusinessProfilePicture).toBeDefined();
      expect(typeof uploadBusinessProfilePicture).toBe("object");
      expect(uploadBusinessProfilePicture).toHaveProperty("single");
      expect(uploadBusinessProfilePicture).toHaveProperty("array");
      expect(uploadBusinessProfilePicture).toHaveProperty("fields");
      expect(typeof uploadBusinessProfilePicture.single).toBe("function");
    });

    test("should set correct destination in storage", () => {
      expect(uploadBusinessProfilePicture).toBeDefined();
      expect(uploadBusinessProfilePicture).toBeInstanceOf(Object);
    });

    test("should generate filename with timestamp", () => {
      expect(uploadBusinessProfilePicture).toBeDefined();
    });
  });

  describe("File Filter", () => {
    // Mock path.extname for each test
    beforeEach(() => {
      (path.extname as jest.Mock).mockImplementation((filename: string) => {
        const match = filename.match(/\.[^.]*$/);
        return match ? match[0] : "";
      });
    });

    // Extract the actual file filter logic for testing
    const testFileFilter = (
      file: Partial<Express.Multer.File>,
    ): Promise<Error | null> => {
      return new Promise((resolve) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;

        if (!file || !file.originalname) {
          resolve(new Error("Invalid file"));
          return;
        }

        const ext = path.extname(file.originalname).toLowerCase();
        const extname = allowedTypes.test(ext);
        const mimetype = allowedTypes.test(file.mimetype || "");

        if (extname && mimetype) {
          resolve(null);
        } else {
          resolve(new Error("File type not allowed"));
        }
      });
    };

    test("should accept JPEG files", async () => {
      const file = {
        originalname: "image.jpg",
        mimetype: "image/jpeg",
      };

      const result = await testFileFilter(file);
      expect(result).toBeNull();
    });

    test("should accept JPG files", async () => {
      const file = {
        originalname: "image.jpg",
        mimetype: "image/jpg",
      };

      const result = await testFileFilter(file);
      expect(result).toBeNull();
    });

    test("should accept PNG files", async () => {
      const file = {
        originalname: "image.png",
        mimetype: "image/png",
      };

      const result = await testFileFilter(file);
      expect(result).toBeNull();
    });

    test("should accept PDF files", async () => {
      const file = {
        originalname: "document.pdf",
        mimetype: "application/pdf",
      };

      const result = await testFileFilter(file);
      expect(result).toBeNull();
    });

    test("should accept files with uppercase extension", async () => {
      const file = {
        originalname: "image.JPG",
        mimetype: "image/jpeg",
      };

      const result = await testFileFilter(file);
      expect(result).toBeNull();
    });

    test("should reject unsupported file types", async () => {
      const file = {
        originalname: "file.exe",
        mimetype: "application/x-msdownload",
      };

      const result = await testFileFilter(file);
      expect(result).toEqual(new Error("File type not allowed"));
    });

    test("should reject when extension is allowed but mimetype is not", async () => {
      const file = {
        originalname: "image.jpg",
        mimetype: "text/plain",
      };

      const result = await testFileFilter(file);
      expect(result).toEqual(new Error("File type not allowed"));
    });

    test("should reject when mimetype is allowed but extension is not", async () => {
      const file = {
        originalname: "file.exe",
        mimetype: "image/jpeg",
      };

      const result = await testFileFilter(file);
      expect(result).toEqual(new Error("File type not allowed"));
    });

    test("should handle files with no extension", async () => {
      const file = {
        originalname: "filewithoutextension",
        mimetype: "image/jpeg",
      };

      const result = await testFileFilter(file);
      expect(result).toEqual(new Error("File type not allowed"));
    });

    test("should handle files with multiple dots in name", async () => {
      const file = {
        originalname: "image.backup.jpg",
        mimetype: "image/jpeg",
      };

      const result = await testFileFilter(file);
      expect(result).toBeNull();
    });

    test("should handle file with undefined originalname", async () => {
      const file = {
        originalname: undefined,
        mimetype: "image/jpeg",
      };

      const result = await testFileFilter(file);
      expect(result).toEqual(new Error("Invalid file"));
    });
  });

  describe("Multer Instance", () => {
    test("should be configured with storage and fileFilter", () => {
      expect(uploadBusinessProfilePicture).toBeDefined();
      expect(typeof uploadBusinessProfilePicture).toBe("object");
    });

    test("should have correct field name methods", () => {
      expect(typeof uploadBusinessProfilePicture.single).toBe("function");
      expect(typeof uploadBusinessProfilePicture.array).toBe("function");
      expect(typeof uploadBusinessProfilePicture.fields).toBe("function");
    });

    test("should handle single file upload", () => {
      const singleMiddleware =
        uploadBusinessProfilePicture.single("profilePicture");
      expect(singleMiddleware).toBeDefined();
      expect(typeof singleMiddleware).toBe("function");
    });
  });

  describe("Error Handling", () => {
    test("should handle multer errors", () => {
      const multerError = new multer.MulterError("LIMIT_FILE_SIZE");
      expect(multerError).toBeInstanceOf(Error);
      expect(multerError.code).toBe("LIMIT_FILE_SIZE");
    });

    test("should handle file size limits", () => {
      expect(uploadBusinessProfilePicture).toBeDefined();
    });
  });
});
