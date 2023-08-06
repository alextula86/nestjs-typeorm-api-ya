import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallpapers } from './entities';
import {
  WallpaperModel,
  MakeWallpaperModel,
  UpdateWallpaperModel,
} from './types';

@Injectable()
export class WallpaperRepository {
  constructor(
    @InjectRepository(Wallpapers)
    private readonly wallpaperRepository: Repository<Wallpapers>,
  ) {}
  // Поиск картинки обоев конкретного блогера по его идентификатору
  async findWallpaperByBlogId(blogId: string): Promise<WallpaperModel | null> {
    const foundWallpaper = await this.wallpaperRepository.query(
      `SELECT * FROM wallpapers WHERE "blogId" = '${blogId}';`,
    );

    if (!foundWallpaper) {
      return null;
    }

    return foundWallpaper[0];
  }
  // Создаем картинку обоев для блога
  async createWallpaperByBlogId({
    url,
    width,
    height,
    fileSize,
    blogId,
    userId,
  }: MakeWallpaperModel): Promise<{ id: string }> {
    const madeWallpaper = await this.wallpaperRepository
      .createQueryBuilder()
      .insert()
      .into(Wallpapers)
      .values({
        url,
        width,
        height,
        fileSize,
        blogId,
        userId,
      })
      .returning(['id'])
      .execute();

    return madeWallpaper.raw[0];
  }
  // Обновляем картинку обоев для блога по идентификатору картинки
  async updateWallpaperByBlogId(
    wallpaperId: string,
    { url, width, height, fileSize }: UpdateWallpaperModel,
  ): Promise<boolean> {
    await this.wallpaperRepository
      .createQueryBuilder()
      .update(Wallpapers)
      .set({ url, width, height, fileSize })
      .where('id = :wallpaperId', { wallpaperId })
      .execute();

    return true;
  }
}
