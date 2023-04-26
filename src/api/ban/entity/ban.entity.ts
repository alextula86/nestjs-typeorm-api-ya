import { getNextStrId } from '../../../utils';

export class BanEntity {
  id: string;
  createdAt: string;
  banDate: Date;
  constructor(
    public userId: string,
    public login: string,
    public blogId: string,
    public blogName: string,
    public isBanned: boolean,
    public banReason: string,
  ) {
    this.id = getNextStrId();
    this.banDate = new Date();
    this.createdAt = new Date().toISOString();
  }
}
