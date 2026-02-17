import { Request, Response } from "express";
import { BusinessService } from "../services/business.service";
import {
  RegisterBusinessDto,
  LoginBusinessDto,
  ApproveBusinessDto,
} from "../dtos/business.dto";
import { EditUserDTO } from "../dtos/user.dto";
import jwt from "jsonwebtoken"; // Add this import

export class BusinessController {
  private businessService = new BusinessService();

  register = async (req: Request, res: Response) => {
    try {
      const validation = RegisterBusinessDto.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }

      const profilePicture = req.file ? req.file.path : undefined;

      const result = await this.businessService.register({
        ...validation.data,
        profilePicture,
      });

      return res.status(201).json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const validation = LoginBusinessDto.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }

      const result = await this.businessService.login(validation.data);

      console.log("🔍 Business service returned:", result);
      console.log("🔍 Business object:", result.business);
      console.log("🔍 Business id:", result.business.id);
      console.log("🔍 Business _id:", result.business._id);

      // Use _id if id doesn't exist
      const businessId = result.business.id || result.business._id;

      if (!businessId) {
        console.error("❌ No business ID found in:", result.business);
        return res.status(500).json({
          success: false,
          message: "Business ID not found in token creation",
        });
      }

      // Generate JWT token with business ID
      const tokenPayload = {
        id: businessId,
        role: "Business",
        businessId: businessId,
      };

      console.log("📝 Token payload being signed:", tokenPayload);

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET as string, {
        expiresIn: "7d",
      });

      return res.status(200).json({
        success: true,
        token,
        business: result.business,
      });
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  uploadDocument = async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user?.id;
      if (!businessId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized: No user ID found" });
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No document uploaded" });
      }

      const updated = await this.businessService.uploadDocument(
        businessId,
        req.file.path,
      );
      return res.status(200).json({
        success: true,
        message: "Document uploaded",
        document: updated.businessDocument,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  approve = async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const validation = ApproveBusinessDto.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ errors: validation.error });
      }

      const updated = await this.businessService.approveBusiness(
        businessId,
        validation.data,
      );

      return res.status(200).json({
        success: true,
        message: `Business ${validation.data.action} successfully`,
        data: {
          businessStatus: updated.businessStatus,
          businessVerified: updated.businessVerified,
          ...(updated.rejectionReason && {
            rejectionReason: updated.rejectionReason,
          }),
        },
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const businesses = await this.businessService.getAllBusinesses();
      return res.status(200).json({
        success: true,
        count: businesses.length,
        businesses,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  getProfile = async (req: any, res: Response) => {
    console.log("📥 getProfile controller called");
    console.log("req.user:", req.user);
    console.log("req.user.id:", req.user?.id);

    try {
      const businessId = req.user.id;
      console.log("Looking up business with ID:", businessId);

      const profile = await this.businessService.getBusinessProfile(businessId);
      console.log("✅ Profile found:", profile);

      res.status(200).json(profile);
    } catch (error: any) {
      console.error("❌ Error in getProfile:", error.message);
      res.status(404).json({ message: error.message });
    }
  };

  editProfile = async (req: any, res: Response) => {
    try {
      const businessId = req.user.id;
      const result = await this.businessService.editBusinessProfile(
        businessId,
        req.body,
      );
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
