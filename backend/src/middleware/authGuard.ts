import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "User" | "Business" | "Admin";
        permissions?: string[];
        isAdmin?: boolean;
        businessId?: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  role: "User" | "Business" | "Admin";
  permissions?: string[];
  isAdmin?: boolean;
  businessId?: string;
}

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: "Authorization header missing!" });

  const token = authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, message: "Token missing!" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      permissions: decoded.permissions,
      isAdmin: decoded.isAdmin,
      ...(decoded.businessId && { businessId: decoded.businessId }),
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token!" });
  }
};

export const authGuardAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization header missing!" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing!" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      permissions: decoded.permissions,
      isAdmin: decoded.isAdmin,
      ...(decoded.businessId && { businessId: decoded.businessId }),
    };

    if (req.user.role !== "Admin" && req.user.isAdmin !== true) {
      return res
        .status(403)
        .json({ success: false, message: "Permission denied! Admins only." });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token!" });
  }
};

export const authGuardBusiness = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized! No user data found." });

  if (req.user.role !== "Business")
    return res.status(403).json({
      success: false,
      message: "Access denied! Only business users allowed.",
    });

  next();
};
