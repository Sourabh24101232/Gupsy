import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../model/User.js";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (req: AuthenticatedRequest,res: Response,next: NextFunction,): Promise<void> => {
  try {

    // Get Authorization header
    const authHeader = req.headers.authorization;
    // Check whether Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "Please Login - No token",
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];
    // Make sure token actually exists
    if (!token) {
      res.status(401).json({
        message: "Invalid authorization header",
      });
      return;
    }

    // Verify JWT
    const decodedValue = jwt.verify(token,process.env.JWT_SECRET as string,) as JwtPayload;

    // Check decoded data
    if (!decodedValue || !decodedValue.user) {
      res.status(401).json({
        message: "Invalid token",
      });
      return;
    }

    // Attach user to request
    req.user = decodedValue.user as IUser;

    // Continue to next middleware/controller
    next();
  } catch (error) {
    res.status(401).json({
      message: "Please Login - JWT error",
    });
  }
};
