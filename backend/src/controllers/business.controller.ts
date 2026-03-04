import { Request, Response } from "express";
import { BusinessService } from "../services/business.service";
import {
  RegisterBusinessDto,
  LoginBusinessDto,
  ApproveBusinessDto,
} from "../dtos/business.dto";
import jwt from "jsonwebtoken";

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
      const businessId = result.business.id || result.business._id;

      if (!businessId) {
        return res.status(500).json({
          success: false,
          message: "Business ID not found",
        });
      }

      const token = jwt.sign(
        { id: businessId, role: "Business", businessId },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" },
      );

      return res.status(200).json({
        success: true,
        token,
        business: result.business,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  uploadDocument = async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user?.id;
      if (!businessId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
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
    try {
      const profile = await this.businessService.getBusinessProfile(
        req.user.id,
      );
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  };

  editProfile = async (req: any, res: Response) => {
    try {
      console.log("Edit profile request body:", req.body);
      console.log("Edit profile file:", req.file);

      const result = await this.businessService.editBusinessProfile(
        req.user.id,
        req.body,
        req.file,
      );
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Edit profile error:", error);
      res.status(400).json({ message: error.message });
    }
  };
}
