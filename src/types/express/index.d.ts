import { IUser } from "../../types";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// This ensures the file is treated as a module
export {};
