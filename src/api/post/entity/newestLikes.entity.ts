import { getNextStrId } from '../../../utils';

export class NewestLikesEntity {
  id: string;
  createdAt: string;
  constructor(public userId: string, public userLogin: string) {
    this.id = getNextStrId();
    this.createdAt = new Date().toISOString();
  }
}
