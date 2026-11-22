import 'mocha';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import { getRepository, Repository } from 'typeorm';

import { dbCreateConnection } from 'orm/dbCreateConnection';
import { User } from 'orm/entities/users/User';
import { CustomError } from 'utils/response/custom-error/CustomError';

import { validatorEdit } from './validatorEdit';

describe('validatorEdit middleware', () => {
  let userRepository: Repository<User>;

  const existingUser = new User();
  existingUser.username = 'EditValidatorUser';
  existingUser.name = 'Edit Validator';
  existingUser.email = 'edit.validator@test.com';
  existingUser.password = 'pass1';
  existingUser.hashPassword();

  const runValidatorEdit = async (username?: string | null) => {
    const request = { body: { username } } as unknown as Request;
    const response = {} as unknown as Response;
    let isNextCalled = false;
    let nextError: unknown;
    const next: NextFunction = (err?: unknown) => {
      isNextCalled = true;
      nextError = err;
    };

    await validatorEdit(request, response, next);

    return { isNextCalled, nextError };
  };

  before(async () => {
    await dbCreateConnection();
    userRepository = getRepository(User);
    await userRepository.delete({ email: existingUser.email });
    await userRepository.save(existingUser);
  });

  after(async () => {
    await userRepository.delete(existingUser.id);
  });

  it('should report validation error when username already exists', async () => {
    const { isNextCalled, nextError } = await runValidatorEdit(existingUser.username);

    expect(isNextCalled).to.equal(true);
    expect(nextError).to.be.instanceOf(CustomError);
    if (!(nextError instanceof CustomError)) {
      throw new Error('Expected CustomError');
    }
    expect(nextError.HttpStatusCode).to.equal(400);
    expect(nextError.JSON.errorType).to.equal('Validation');
    expect(nextError.JSON.errorMessage).to.equal('Edit user validation error');
    expect(nextError.JSON.errors).to.equal(null);
    expect(nextError.JSON.errorRaw).to.equal(null);
    expect(nextError.JSON.errorsValidation).to.eql([
      { username: `Username '${existingUser.username}' already exists` },
    ]);
  });

  it('should pass validation when username is free', async () => {
    const { isNextCalled, nextError } = await runValidatorEdit('EditValidatorFreeUsername');

    expect(isNextCalled).to.equal(true);
    expect(nextError).to.equal(undefined);
  });

  it('should pass validation when username is missing', async () => {
    const { isNextCalled, nextError } = await runValidatorEdit();

    expect(isNextCalled).to.equal(true);
    expect(nextError).to.equal(undefined);
  });

  it('should pass validation when username is null', async () => {
    const { isNextCalled, nextError } = await runValidatorEdit(null);

    expect(isNextCalled).to.equal(true);
    expect(nextError).to.equal(undefined);
  });
});
