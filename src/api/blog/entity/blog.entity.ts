import { getNextStrId } from '../../../utils';

export class BlogEntity {
  id: string;
  createdAt: string;
  isMembership: boolean;
  isBanned: boolean;
  banDate: Date;
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
    public userId: string,
    public userLogin: string,
  ) {
    this.id = getNextStrId();
    this.isMembership = false;
    this.isBanned = false;
    this.banDate = null;
    this.createdAt = new Date().toISOString();
  }
}
