import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BlogMainImages } from './entities';
import {
  BlogMainImageModel,
  MakeBlogMainImageModel,
  UpdateBlogMainImageModel,
} from './types';

@Injectable()
export class BlogMainImageRepository {
  constructor(
    @InjectRepository(BlogMainImages)
    private readonly blogMainImageRepository: Repository<BlogMainImages>,
  ) {}
  // Поиск картинки конкретного блогера по его идентификатору
  async findBlogMainImageByBlogId(
    blogId: string,
  ): Promise<BlogMainImageModel | null> {
    const foundBlogMainImage = await this.blogMainImageRepository.query(
      `SELECT * FROM blog_main_images WHERE "blogId" = '${blogId}';`,
    );

    if (!foundBlogMainImage) {
      return null;
    }

    return foundBlogMainImage[0];
  }
  // Создаем картинку для блога
  async createBlogMainImageByBlogId({
    url,
    width,
    height,
    fileSize,
    blogId,
  }: MakeBlogMainImageModel): Promise<{ id: string }> {
    const madeBlogMainImage = await this.blogMainImageRepository
      .createQueryBuilder()
      .insert()
      .into(BlogMainImages)
      .values({
        url,
        width,
        height,
        fileSize,
        blogId,
      })
      .returning(['id'])
      .execute();

    return madeBlogMainImage.raw[0];
  }
  // Обновляем картинку для блога по идентификатору картинки
  async updateBlogMainImageById(
    blogMainImageId: string,
    { url, width, height, fileSize }: UpdateBlogMainImageModel,
  ): Promise<boolean> {
    await this.blogMainImageRepository
      .createQueryBuilder()
      .update(BlogMainImages)
      .set({ url, width, height, fileSize })
      .where('id = :blogMainImageId', { blogMainImageId })
      .execute();

    return true;
  }
}
