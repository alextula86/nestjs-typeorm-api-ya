import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import { ImageType } from '../../types';
import { PostMainImageViewModel } from './types';

@Injectable()
export class PostMainImageQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async findPostImages(postId: string): Promise<PostMainImageViewModel> {
    const mainImages = await this.dataSource.query(`
      SELECT 
        "url", 
        "width", 
        "height",
        "fileSize"
      FROM post_main_images
      WHERE "postId" = '${postId}';
    `);

    return this._getMainImageViewModel(mainImages);
  }
  _getMainImageViewModel(mainImages: ImageType[]): PostMainImageViewModel {
    return {
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
