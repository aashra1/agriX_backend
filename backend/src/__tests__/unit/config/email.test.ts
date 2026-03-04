jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

describe("Email Configuration", () => {
  const originalEnv = process.env;
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Completely isolate process.env
    process.env = { ...originalEnv };

    // Explicitly remove these so real .env values don't leak in
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;

    mockSendMail = jest.fn();

    jest.doMock("nodemailer", () => ({
      createTransport: jest.fn().mockReturnValue({
        sendMail: mockSendMail,
      }),
    }));
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Transporter Creation", () => {
    test("should create transporter with correct Gmail configuration", () => {
      // Set test values
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpassword";

      const { transporter } = require("../../../config/email");

      const nodemailer = require("nodemailer");
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: "gmail",
        auth: {
          user: "test@gmail.com",
          pass: "testpassword",
        },
      });
      expect(transporter).toBeDefined();
    });

    test("should handle missing environment variables", () => {
      // IMPORTANT: Delete env vars BEFORE requiring the module
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;

      // This should now use undefined values
      expect(() => {
        require("../../../config/email");
      }).not.toThrow();

      const nodemailer = require("nodemailer");
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: "gmail",
        auth: {
          user: undefined,
          pass: undefined,
        },
      });
    });
  });

  describe("sendEmail", () => {
    const testEmail = "recipient@example.com";
    const testSubject = "Test Subject";
    const testHtml = "<p>Test HTML content</p>";

    beforeEach(() => {
      jest.resetModules();
      mockSendMail.mockReset();

      jest.doMock("nodemailer", () => ({
        createTransport: jest.fn().mockReturnValue({
          sendMail: mockSendMail,
        }),
      }));
    });

    test("should send email successfully", async () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpass";

      const { sendEmail } = require("../../../config/email");
      mockSendMail.mockResolvedValueOnce({ messageId: "12345" });

      await sendEmail(testEmail, testSubject, testHtml);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "Agrix <test@gmail.com>",
        to: testEmail,
        subject: testSubject,
        html: testHtml,
      });
    });

    test("should handle when EMAIL_USER is not set", async () => {
      // CRITICAL: Delete env var BEFORE requiring the module
      delete process.env.EMAIL_USER;
      process.env.EMAIL_PASS = "testpass";

      const { sendEmail } = require("../../../config/email");
      await sendEmail(testEmail, testSubject, testHtml);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "Agrix <undefined>",
        }),
      );
    });

    test("should propagate nodemailer errors", async () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpass";

      const { sendEmail } = require("../../../config/email");
      const error = new Error("SMTP connection failed");
      mockSendMail.mockRejectedValueOnce(error);

      await expect(sendEmail(testEmail, testSubject, testHtml)).rejects.toThrow(
        "SMTP connection failed",
      );
    });

    test("should handle empty email fields", async () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpass";

      const { sendEmail } = require("../../../config/email");
      await sendEmail("", "", "");

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "Agrix <test@gmail.com>",
        to: "",
        subject: "",
        html: "",
      });
    });

    test("should handle very long email content", async () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpass";

      const { sendEmail } = require("../../../config/email");
      const longHtml = "<p>" + "A".repeat(10000) + "</p>";

      await sendEmail(testEmail, testSubject, longHtml);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: longHtml,
        }),
      );
    });

    test("should handle multiple email sends sequentially", async () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpass";

      const { sendEmail } = require("../../../config/email");
      mockSendMail
        .mockResolvedValueOnce({ messageId: "1" })
        .mockResolvedValueOnce({ messageId: "2" });

      await sendEmail("first@example.com", "Subject 1", "<p>Content 1</p>");
      await sendEmail("second@example.com", "Subject 2", "<p>Content 2</p>");

      expect(mockSendMail).toHaveBeenCalledTimes(2);
    });

    test("should handle special characters in email content", async () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpass";

      const { sendEmail } = require("../../../config/email");
      const specialHtml = "<p>Üñîçødé & ©®™</p>";

      await sendEmail(testEmail, testSubject, specialHtml);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: specialHtml,
        }),
      );
    });
  });

  describe("Transporter Instance", () => {
    test("should export a configured transporter", () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpass";

      const { transporter } = require("../../../config/email");

      expect(transporter).toBeDefined();
      expect(typeof transporter.sendMail).toBe("function");
    });

    test("transporter should use correct configuration", () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "testpass";

      require("../../../config/email");

      const nodemailer = require("nodemailer");
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: "gmail",
        auth: {
          user: "test@gmail.com",
          pass: "testpass",
        },
      });
    });
  });

  describe("Environment Variable Integration", () => {
    test("should use EMAIL_USER from environment", () => {
      process.env.EMAIL_USER = "custom@email.com";
      process.env.EMAIL_PASS = "testpass";

      require("../../../config/email");

      const nodemailer = require("nodemailer");
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: expect.objectContaining({
            user: "custom@email.com",
          }),
        }),
      );
    });

    test("should use EMAIL_PASS from environment", () => {
      process.env.EMAIL_USER = "test@gmail.com";
      process.env.EMAIL_PASS = "secretpass123";

      require("../../../config/email");

      const nodemailer = require("nodemailer");
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: expect.objectContaining({
            pass: "secretpass123",
          }),
        }),
      );
    });
  });
});
