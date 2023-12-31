import crypto from 'crypto';
import { User } from '@aneuhold/core-ts-db-lib';
import UserRepository from '../../../repositories/common/UserRepository';
import { cleanupDoc, getTestUserName } from '../../testsUtil';
import DocumentDb from '../../../util/DocumentDb';
import DashboardUserConfigRepository from '../../../repositories/dashboard/DashboardUserConfigRepository';

const userRepo = UserRepository.getRepo();
const configRepo = DashboardUserConfigRepository.getRepo();

describe('Create operations', () => {
  it('can create a new user config', async () => {
    // User configs are created automatically when a new user is created
    const newUser = await createNewTestUser();
    const newConfig = await configRepo.get({ userId: newUser._id });
    expect(newConfig).toBeTruthy();
    if (!newConfig) {
      return;
    }

    await cleanupDoc(userRepo, newUser);
  });
});

describe('Update operations', () => {
  it('can update an existing user config', async () => {
    const newUser = await createNewTestUser();
    const newConfig = await configRepo.get({ userId: newUser._id });
    expect(newConfig).toBeTruthy();
    if (!newConfig) {
      return;
    }

    newConfig.enableDevMode = true;
    await configRepo.update(newConfig);
    const updatedConfig = await configRepo.get({ _id: newConfig._id });
    expect(updatedConfig?.enableDevMode).toBe(true);

    await cleanupDoc(userRepo, newUser);
  });

  it('can add collaborators to an existing user config', async () => {
    const newUser = await createNewTestUser();
    const newConfig = await configRepo.get({ userId: newUser._id });
    expect(newConfig).toBeTruthy();
    if (!newConfig) {
      return;
    }

    const newCollaborator = await createNewTestUser();
    newConfig.collaborators.push(newCollaborator._id);
    await configRepo.update(newConfig);
    let updatedConfig = await configRepo.get({ _id: newConfig._id });
    expect(updatedConfig?.collaborators).toContainEqual(newCollaborator._id);

    await cleanupDoc(userRepo, newCollaborator);
    // Ensure the collaborator is deleted automatically when the user is deleted
    updatedConfig = await configRepo.get({ _id: newConfig._id });
    expect(updatedConfig?.collaborators).not.toContainEqual(
      newCollaborator._id
    );

    await cleanupDoc(userRepo, newUser);
  });

  /**
   * Pretty huge test that ensures the full range of functionality is there
   * for collaborators.
   */
  it('correctly updates the collaborators for groups of users', async () => {
    const newUser1 = await createNewTestUser();
    const newConfig1 = await configRepo.get({ userId: newUser1._id });
    expect(newConfig1).toBeTruthy();
    if (!newConfig1) {
      return;
    }

    const newUser2 = await createNewTestUser();
    const newConfig2 = await configRepo.get({ userId: newUser2._id });
    expect(newConfig2).toBeTruthy();
    if (!newConfig2) {
      return;
    }

    const newUser3 = await createNewTestUser();
    const newConfig3 = await configRepo.get({ userId: newUser3._id });
    expect(newConfig3).toBeTruthy();
    if (!newConfig3) {
      return;
    }

    newConfig1.collaborators.push(newUser2._id);
    const updateResult1 = await configRepo.update(newConfig1);
    expect(updateResult1).toBeTruthy();
    let updatedConfig2 = await configRepo.get({ _id: newConfig2._id });
    expect(updatedConfig2?.collaborators).toContainEqual(newUser1._id);

    newConfig3.collaborators.push(newUser1._id, newUser2._id);
    let updateResult3 = await configRepo.update(newConfig3);
    expect(updateResult3).toBeTruthy();
    let updatedConfig1 = await configRepo.get({ _id: newConfig1._id });
    expect(updatedConfig1?.collaborators).toContainEqual(newUser3._id);
    expect(updatedConfig1?.collaborators).toContainEqual(newUser2._id);

    newConfig3.collaborators = [];
    updateResult3 = await configRepo.update(newConfig3);
    expect(updateResult3).toBeTruthy();
    updatedConfig1 = await configRepo.get({ _id: newConfig1._id });
    expect(updatedConfig1?.collaborators).toContainEqual(newUser2._id);
    expect(updatedConfig1?.collaborators).not.toContainEqual(newUser3._id);
    updatedConfig2 = await configRepo.get({ _id: newConfig2._id });
    expect(updatedConfig2?.collaborators).toContainEqual(newUser1._id);
    expect(updatedConfig2?.collaborators).not.toContainEqual(newUser3._id);

    await cleanupDoc(userRepo, newUser1);
    await cleanupDoc(userRepo, newUser2);
    await cleanupDoc(userRepo, newUser3);
  }, 10000);
});

afterAll(async () => {
  return DocumentDb.closeDbConnection();
});

async function createNewTestUser() {
  const newUser = new User(
    getTestUserName(`${crypto.randomUUID()}userconfigtest`)
  );
  newUser.projectAccess.dashboard = true;
  const insertResult = await userRepo.insertNew(newUser);
  expect(insertResult).toBeTruthy();
  return newUser;
}
