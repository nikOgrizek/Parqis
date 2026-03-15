import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../../../shared/observability/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation failed', { errors, body: req.body });

      res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      .required()
      .messages({
        'string.pattern.base': 'Password must include at least one uppercase letter, one lowercase letter, and one number',
      }),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  createReservation: Joi.object({
    parkingLotId: Joi.string().uuid().required(),
    plateNumber: Joi.string()
      .pattern(/^[A-Z]{2}-[A-Z0-9]{2,3}-[A-Z0-9]{2,3}$/i)
      .required()
      .messages({
        'string.pattern.base': 'Invalid plate number format (expected: LJ-XX-123)',
      }),
    startTime: Joi.date().iso().min('now').required(),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  }),

  extendReservation: Joi.object({
    newEndTime: Joi.date().iso().required(),
  }),

  updateReservation: Joi.object({
    endTime: Joi.date().iso().optional(),
    status: Joi.string()
      .valid('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED')
      .optional(),
  }),
};
