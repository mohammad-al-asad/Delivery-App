import "express";

declare module "express" {
  interface Request {
    params: Record<string, string>;
    user?: {
      userId: string;
      fullName: string;
      email: string;
      role: string;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      params: Record<string, string>;
      user?: {
        userId: string;
        fullName: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
