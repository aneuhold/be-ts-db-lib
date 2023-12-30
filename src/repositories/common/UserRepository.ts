import { User } from '@aneuhold/core-ts-db-lib';
import BaseRepository from '../BaseRepository';
import UserValidator from '../../validators/common/UserValidator';
import ApiKeyRepository from './ApiKeyRepository';
import DashboardUserConfigRepository from '../dashboard/DashboardUserConfigRepository';

/**
 * The repository that contains {@link User} documents.
 */
export default class UserRepository extends BaseRepository<User> {
  private static COLLECTION_NAME = 'users';

  private static singletonInstance: UserRepository;

  private constructor() {
    super(UserRepository.COLLECTION_NAME, new UserValidator());
  }

  protected setupSubscribers(): void {
    this.subscribeToChanges(ApiKeyRepository.getListenersForUserRepo());
    this.subscribeToChanges(
      DashboardUserConfigRepository.getListenersForUserRepo()
    );
  }

  /**
   * Gets the singleton instance of the {@link UserRepository}.
   */
  static getRepo() {
    if (!UserRepository.singletonInstance) {
      UserRepository.singletonInstance = new UserRepository();
    }
    return UserRepository.singletonInstance;
  }
}
