import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PostMainImages } from './entities';
import {
  PostMainImageModel,
  MakePostMainImageModel,
  UpdatePostMainImageModel,
} from './types';

@Injectable()
export class PostMainImageRepository {
  constructor(
    @InjectRepository(PostMainImages)
    private readonly postMainImageRepository: Repository<PostMainImages>,
  ) {}
  // Поиск иконки конкретного поста по его идентификатору
  async findPostMainImage(postId: string): Promise<PostMainImageModel | null> {
    const foundPostMainImage = await this.postMainImageRepository.query(
      `SELECT * FROM post_main_images WHERE "postId" = '${postId}';`,
    );

    if (!foundPostMainImage) {
      return null;
    }

    return foundPostMainImage;
  }
  // Создаем иконку для поста
  async createPostMainImage({
    url,
    width,
    height,
    fileSize,
    postId,
    type,
  }: MakePostMainImageModel): Promise<{ id: string }> {
    const madePostMainImage = await this.postMainImageRepository
      .createQueryBuilder()
      .insert()
      .into(PostMainImages)
      .values({
        url,
        width,
        height,
        fileSize,
        postId,
        type,
      })
      .returning(['id'])
      .execute();

    return madePostMainImage.raw[0];
  }
  // Обновляем иконку для поста по идентификатору
  async updatePostMainImage(
    postId: string,
    { url, width, height, fileSize, type }: UpdatePostMainImageModel,
  ): Promise<boolean> {
    await this.postMainImageRepository
      .createQueryBuilder()
      .update(PostMainImages)
      .set({ url, width, height, fileSize })
      .where('id = :postId', { postId })
      .andWhere('type = :type', { type })
      .execute();

    return true;
  }
}
