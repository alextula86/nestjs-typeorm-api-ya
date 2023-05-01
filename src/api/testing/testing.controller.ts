import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller('api/testing')
export class TestingController {
  constructor(
    @InjectDataSource() private dataSource: DataSource, // private readonly userRepository: UserRepository, // private readonly blogRepository: BlogRepository, // private readonly postRepository: PostRepository, // private readonly commentRepository: CommentRepository, // private readonly sessionRepository: SessionRepository, // private readonly likeStatusRepository: LikeStatusRepository, // private readonly banRepository: BanRepository, // private readonly deviceSqlRepository: DeviceSqlRepository,
  ) {}
  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    await this.dataSource.query(`
      TRUNCATE TABLE 
        email_confirmation,
        password_recovery,
        ban_user_info,
        ban_user_for_blog,
        sessions,
        devices,
        comment_like_status,
        comments,
        post_like_status,
        posts,
        blogs,
        users;
    `);
  }
}
