import { Injectable } from '@nestjs/common';
import { CommentRepository } from './comment.repository';

@Injectable()
export class CommentService {
  constructor(private readonly commentRepository: CommentRepository) {}
  // Поис комментария
  async findCommentById(commentId: string): Promise<{
    id: string;
    content: string;
    createdAt: string;
    isBanned: boolean;
    userId: string;
    userLogin: string;
    blogId: string;
    blogName: string;
    postId: string;
    postTitle: string;
  } | null> {
    const foundCommentById = await this.commentRepository.findCommentById(
      commentId,
    );

    if (!foundCommentById) {
      return null;
    }

    return foundCommentById;
  }
}
