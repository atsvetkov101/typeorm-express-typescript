import 'mocha';
import { expect } from 'chai';
import { agent as request } from 'supertest';
import { getRepository, Connection, Repository } from 'typeorm';

import { dbCreateConnection } from 'orm/dbCreateConnection';
import { Role } from 'orm/entities/users/types';
import { User } from 'orm/entities/users/User';

import { app } from '../../';

describe('User info', () => {
  let dbConnection: Connection | null;
  let userRepository: Repository<User>;

  const userPassword = 'pass1';
  let adminUserToken: string;
  const adminUser = new User();
  adminUser.username = 'Badger';
  adminUser.name = 'Brandon Mayhew';
  adminUser.email = 'brandon.mayhew@test.com';
  adminUser.password = userPassword;
  adminUser.hashPassword();
  adminUser.role = 'ADMINISTRATOR' as Role;

  let standardUserToken: string;
  const standardUser = new User();
  standardUser.username = 'Toddy';
  standardUser.name = 'Todd Alquist';
  standardUser.email = 'todd.alquist@test.com';
  standardUser.password = userPassword;
  standardUser.hashPassword();
  standardUser.role = 'STANDARD' as Role;

  before(async () => {
    dbConnection = await dbCreateConnection();
    userRepository = getRepository(User);
  });

  beforeEach(async () => {
    await userRepository.save([adminUser, standardUser]);
    let res = await request(app).post('/v1/auth/login').send({ email: adminUser.email, password: userPassword });
    adminUserToken = res.body.data;
    res = await request(app).post('/v1/auth/login').send({ email: standardUser.email, password: userPassword });
    standardUserToken = res.body.data;
  });

  afterEach(async () => {
    await userRepository.delete([adminUser.id, standardUser.id]);
  });

  it('should get info of the current administrator', async () => {
    const res = await request(app).get('/v1/user-info').set('Authorization', adminUserToken);
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('User info.');
    expect(res.body.data.email).to.eql(adminUser.email);
    expect(res.body.data.username).to.eql(adminUser.username);
    expect(res.body.data.role).to.eql('ADMINISTRATOR');
    expect(res.body.data).to.not.have.property('password');
  });

  it('should get info of the current standard user', async () => {
    const res = await request(app).get('/v1/user-info').set('Authorization', standardUserToken);
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('User info.');
    expect(res.body.data.email).to.eql(standardUser.email);
    expect(res.body.data.role).to.eql('STANDARD');
    expect(res.body.data).to.not.have.property('password');
  });

  it('should report error when authorization header is not provided', async () => {
    const res = await request(app).get('/v1/user-info');
    expect(res.status).to.equal(400);
    expect(res.body.errorType).to.equal('General');
    expect(res.body.errorMessage).to.equal('Authorization header not provided');
  });

  it('should report error when token is invalid', async () => {
    const res = await request(app).get('/v1/user-info').set('Authorization', 'Bearer invalid_token');
    expect(res.status).to.equal(401);
    expect(res.body.errorType).to.equal('Raw');
    expect(res.body.errorMessage).to.equal('JWT error');
  });

  it('should report error when user from token is not found', async () => {
    await userRepository.delete(standardUser.id);
    const res = await request(app).get('/v1/user-info').set('Authorization', standardUserToken);
    expect(res.status).to.equal(404);
    expect(res.body.errorType).to.equal('General');
    expect(res.body.errorMessage).to.equal('User not found.');
    expect(res.body.errors).to.eql(['User not found.']);
  });
});
