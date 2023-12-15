import crypto from 'crypto';
import { User } from '@aneuhold/core-ts-db-lib';
import UserRepository from '../../repositories/common/UserRepository';
import { cleanupDoc } from '../testsUtil';
import DocumentDb from '../../util/DocumentDb';

it('can create a new document and delete it', async () => {
  const userRepository = UserRepository.getRepo();
  const newUser = new User(crypto.randomUUID());
  const createResult = await userRepository.insertNew(newUser);
  expect(createResult).toBeTruthy();

  await cleanupDoc(userRepository, newUser);
});

afterAll(async () => {
  return DocumentDb.closeDbConnection();
});