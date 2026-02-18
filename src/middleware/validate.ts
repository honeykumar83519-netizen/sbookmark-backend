import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Validate request body, query, or params based on which exists
            const data = { ...req.body, ...req.query, ...req.params };
            schema.parse(data);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((err: ZodIssue) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errorMessages,
                });
            } else {
                next(error);
            }
        }
    };
};
