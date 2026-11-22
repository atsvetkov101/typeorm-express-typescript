import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';

import { User } from 'orm/entities/users/User';
import { CustomError } from 'utils/response/custom-error/CustomError';

type EditUserBody = {
  username?: string;
};

export const validatorEdit = async (req: Request, res: Response, next: NextFunction) => {
  const body: EditUserBody = req.body;
  const username = body.username || '';

  const userRepository = getRepository(User);
  const user = await userRepository.findOne({ username });

  if (user) {
    const customError = new CustomError(400, 'Validation', 'Edit user validation error', null, null, [
      { username: `Username '${username}' already exists` },
    ]);
    return next(customError);
  }

  return next();
};
