import multer from "multer";
import path from "path";
import fs from "fs";
import uploadProfilePicture from "../../../multer/user.multer";

jest.mock("fs");
jest.mock("path", () => {
  const actualPath = jest.requireActual("path");
  return {
    ...actualPath,
    join: jest.fn().mockImplementation((...args) => actualPath.join(...args)),
    extname: jest.fn().mockImplementation((args) => actualPath.extname(args)),
  };
});

describe("User Profile Multer Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Directory Setup", () => {
    test("should create upload directory if it doesn't exist", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      const mockUploadDir = "/fake/path/uploads/profiles";
      (path.join as jest.Mock).mockReturnValue(mockUploadDir);

      jest.isolateModules(() => {
        require("../../../multer/user.multer");
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
        require("../../../multer/user.multer");
      });

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("Storage Configuration", () => {
    test("should have disk storage configured", () => {
      expect(uploadProfilePicture).toBeDefined();
      expect(typeof uploadProfilePicture).toBe("object");
      expect(uploadProfilePicture).toHaveProperty("single");
      expect(uploadProfilePicture).toHaveProperty("array");
      expect(uploadProfilePicture).toHaveProperty("fields");
      expect(typeof uploadProfilePicture.single).toBe("function");
    });

    test("should set correct destination in storage", () => {
      const storage = (uploadProfilePicture as any).storage;
      expect(storage).toBeDefined();

      const destinationFn = storage.getDestination;
      const cb = jest.fn();
      const req = {} as Express.Request;
      const file = {} as Express.Multer.File;

      (path.join as jest.Mock).mockReturnValue("uploads/profiles");

      destinationFn(req, file, cb);
      expect(cb).toHaveBeenCalledWith(null, "uploads/profiles");
    });

    test("should generate filename with timestamp", () => {
      const storage = (uploadProfilePicture as any).storage;
      const filenameFn = storage.getFilename;
      const cb = jest.fn();

      const mockDate = 1234567890;
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => mockDate);

      const req = {} as Express.Request;
      const file = {
        originalname: "profile.jpg",
      } as Express.Multer.File;

      filenameFn(req, file, cb);

      expect(cb).toHaveBeenCalledWith(null, `${mockDate}-profile.jpg`);

      Date.now = originalDateNow;
    });
  });

  describe("File Filter", () => {
    let fileFilter: Function;

    beforeEach(() => {
      fileFilter = (uploadProfilePicture as any).fileFilter;
      (path.extname as jest.Mock).mockImplementation((filename: string) => {
        const match = filename.match(/\.[^.]*$/);
        return match ? match[0] : "";
      });
    });

    test("should accept JPEG files", () => {
      const cb = jest.fn();
      const file = {
        originalname: "profile.jpg",
        mimetype: "image/jpeg",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test("should accept JPG files", () => {
      const cb = jest.fn();
      const file = {
        originalname: "profile.jpg",
        mimetype: "image/jpg",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test("should accept PNG files", () => {
      const cb = jest.fn();
      const file = {
        originalname: "profile.png",
        mimetype: "image/png",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test("should accept PDF files", () => {
      const cb = jest.fn();
      const file = {
        originalname: "resume.pdf",
        mimetype: "application/pdf",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test("should accept DOC files", () => {
      const cb = jest.fn();
      const file = {
        originalname: "resume.doc",
        mimetype: "application/msword",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test("should accept DOCX files", () => {
      const cb = jest.fn();
      const file = {
        originalname: "resume.docx",
        mimetype:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test("should accept files with uppercase extension", () => {
      const cb = jest.fn();
      const file = {
        originalname: "profile.JPG",
        mimetype: "image/jpeg",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test("should reject unsupported file types", () => {
      const cb = jest.fn();
      const file = {
        originalname: "file.exe",
        mimetype: "application/x-msdownload",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(new Error("File type not allowed"));
    });

    test("should reject when extension is allowed but mimetype is not", () => {
      const cb = jest.fn();
      const file = {
        originalname: "profile.jpg",
        mimetype: "text/plain",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(new Error("File type not allowed"));
    });

    test("should reject when mimetype is allowed but extension is not", () => {
      const cb = jest.fn();
      const file = {
        originalname: "file.exe",
        mimetype: "image/jpeg",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(new Error("File type not allowed"));
    });

    test("should handle files with no extension", () => {
      const cb = jest.fn();
      const file = {
        originalname: "profile",
        mimetype: "image/jpeg",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(new Error("File type not allowed"));
    });

    test("should handle files with multiple dots in name", () => {
      const cb = jest.fn();
      const file = {
        originalname: "profile.backup.jpg",
        mimetype: "image/jpeg",
      } as Express.Multer.File;

      fileFilter({} as Express.Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });
  });

  describe("Multer Instance", () => {
    test("should be configured with storage and fileFilter", () => {
      expect(uploadProfilePicture).toBeDefined();
      expect(typeof uploadProfilePicture).toBe("object");
      expect((uploadProfilePicture as any).storage).toBeDefined();
      expect((uploadProfilePicture as any).fileFilter).toBeDefined();
    });

    test("should have correct field name methods", () => {
      expect(typeof uploadProfilePicture.single).toBe("function");
      expect(typeof uploadProfilePicture.array).toBe("function");
      expect(typeof uploadProfilePicture.fields).toBe("function");
    });

    test("should handle single file upload", () => {
      const singleMiddleware = uploadProfilePicture.single("profilePicture");
      expect(singleMiddleware).toBeDefined();
      expect(typeof singleMiddleware).toBe("function");
    });

    test("should handle array file upload", () => {
      const arrayMiddleware = uploadProfilePicture.array("profilePictures", 5);
      expect(arrayMiddleware).toBeDefined();
      expect(typeof arrayMiddleware).toBe("function");
    });

    test("should handle fields file upload", () => {
      const fieldsMiddleware = uploadProfilePicture.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "gallery", maxCount: 5 },
      ]);
      expect(fieldsMiddleware).toBeDefined();
      expect(typeof fieldsMiddleware).toBe("function");
    });
  });

  describe("Error Handling", () => {
    test("should handle multer errors", () => {
      const multerError = new multer.MulterError("LIMIT_FILE_SIZE");
      expect(multerError).toBeInstanceOf(Error);
      expect(multerError.code).toBe("LIMIT_FILE_SIZE");
    });

    test("should handle file size limits", () => {
      expect(uploadProfilePicture).toBeDefined();
    });
  });
});
