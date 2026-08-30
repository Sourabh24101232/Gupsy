import type { NextFunction, Request, RequestHandler, Response } from "express";

const TryCatch = (handler: RequestHandler): RequestHandler => { //Handler : "Give me any Express request handler, and I will execute it safely."
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

export default TryCatch;


//This TryCatch.ts file is a reusable error-handling wrapper for your Express route/controller functions.