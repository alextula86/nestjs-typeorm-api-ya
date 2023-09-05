import { BanInfoType } from '../../../types';

type BlogOwnerInfoType = {
  userId: string;
  userLogin: string;
};

export type BlogViewAdminModel = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: string;
  blogOwnerInfo: BlogOwnerInfoType;
  banInfo: BanInfoType;
};
