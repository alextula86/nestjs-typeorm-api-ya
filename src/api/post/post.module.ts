import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CqrsModule } from '@nestjs/cqrs';

import { PostController } from './post.controller';
import { PostService } from './post.service';
import {
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
} from './use-cases';
import { PostQueryRepository } from './post.query.repository';
import { PostRepository } from './post.repository';
import { Post, PostSchema } from './schemas';

const useCases = [CreatePostUseCase, UpdatePostUseCase, DeletePostUseCase];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    CqrsModule,
  ],
  controllers: [PostController],
  providers: [PostService, PostRepository, PostQueryRepository, ...useCases],
  exports: [PostRepository],
})
export class PostModule {}
