import { ImageType } from '../../../types';

export type BlogViewModel = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: string;
  images: {
    wallpaper: ImageType;
    main: ImageType[];
  };
};
