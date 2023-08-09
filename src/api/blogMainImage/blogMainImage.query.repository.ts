import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { ImageType } from '../../types';
import { BlogMainImageViewModel } from './types';

@Injectable()
export class BlogMainImageQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findBloggerImages(
    blogId: string,
    blogMainImageId: string,
  ): Promise<BlogMainImageViewModel> {
    const wallpaper = await this.dataSource.query(`
      SELECT 
        "url", 
        "width", 
        "height",
        "fileSize"
      FROM wallpapers
      WHERE "blogId" = '${blogId}';
    `);

    const mainImages = await this.dataSource.query(`
      SELECT 
        "url", 
        "width", 
        "height",
        "fileSize"
      FROM blog_main_images
      WHERE "id" = '${blogMainImageId}';
    `);

    return this._getMainImageViewModel(wallpaper[0], mainImages);
  }
  _getMainImageViewModel(
    wallpaper: ImageType,
    mainImages: ImageType[],
  ): BlogMainImageViewModel {
    return {
      wallpaper: {
        url: wallpaper
          ? `https://storage.yandexcloud.net/nestjs-typeorm-api-ya/${wallpaper.url}`
          : '',
        width: wallpaper ? wallpaper.width : 0,
        height: wallpaper ? wallpaper.height : 0,
        fileSize: wallpaper ? wallpaper.fileSize : 0,
      },
      main: !isEmpty(mainImages)
        ? mainImages.map((item) => ({
            url: `https://storage.yandexcloud.net/nestjs-typeorm-api-ya/${item.url}`,
            width: item.width,
            height: item.height,
            fileSize: item.fileSize,
          }))
        : [],
    };
  }
}
