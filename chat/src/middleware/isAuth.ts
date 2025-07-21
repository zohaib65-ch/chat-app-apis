import e, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
// import { IUser } from "../model/user.js";
// import User from "../model/user.js";

interface IUser extends Document {
  _id?: string;
  name?: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
  body: {
    name?: string;
    otherUserId?: string;
  };
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Please Login - Token not found" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    if (!decoded || !decoded.user) {
      res.status(401).json({ message: "Unauthorized: User not found" });
      return;
    }

    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
