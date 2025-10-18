import { Request, Response, NextFunction } from 'express';
import { AppError, logger } from '@invoice-saas/shared';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error('Application error:', {
      statusCode: err.statusCode,
      message: err.message,
      stack: err.stack,
    });

    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  logger.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
