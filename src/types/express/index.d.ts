import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      email?: string;
      name?: string;
    };
    file?: Express.Multer.File;
  }
}


