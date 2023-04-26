import { Injectable } from '@nestjs/common';
import { BlogRepository } from './blog.repository';

@Injectable()
export class BlogService {
  constructor(private readonly blogRepository: BlogRepository) {}
  // Получение конкретного блогера по его идентификатору
  async findBlogById(id: string): Promise<{
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    userId: string;
    isMembership: boolean;
    isBanned: boolean;
    banDate: Date;
    createdAt: string;
  } | null> {
    const foundBlogById = await this.blogRepository.findBlogById(id);

    if (!foundBlogById) {
      return null;
    }

    return foundBlogById;
  }
}
