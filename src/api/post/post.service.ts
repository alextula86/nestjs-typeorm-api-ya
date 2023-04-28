import { Injectable } from '@nestjs/common';
import { PostRepository } from './post.repository';

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}
  // Поиск поста
  async findPostById(postId: string): Promise<{
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
    createdAt: string;
  } | null> {
    const foundPostById = await this.postRepository.findPostById(postId);

    if (!foundPostById) {
      return null;
    }

    return foundPostById;
  }
}
