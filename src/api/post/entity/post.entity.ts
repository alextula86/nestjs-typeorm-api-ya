import { getNextStrId } from '../../../utils';

import { NewestLikesEntity } from '../entity';

export class PostEntity {
  id: string;
  createdAt: string;
  likesCount: number;
  dislikesCount: number;
  newestLikes: NewestLikesEntity[];
  isBanned: boolean;
  constructor(
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public userId: string,
    public userLogin: string,
  ) {
    this.id = getNextStrId();
    this.likesCount = 0;
    this.dislikesCount = 0;
    this.newestLikes = [];
    this.isBanned = false;
    this.createdAt = new Date().toISOString();
  }
}
