import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

// import { UserRepository } from '../user/user.repository';
// import { BlogRepository } from '../blog/blog.repository';
// import { PostRepository } from '../post/post.repository';
// import { CommentRepository } from '../comment/comment.repository';
// import { DeviceSqlRepository } from '../device/device.sql.repository';
// import { SessionRepository } from '../session/session.repository';
// import { LikeStatusRepository } from '../likeStatus/likeStatus.repository';
// import { BanRepository } from '../ban/ban.repository';

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
        ban_info,
        sessions,
        devices,
        posts,
        blogs,
        users;
    `);
    // await this.deviceSqlRepository.deleteAll();
    // await this.userRepository.deleteAll();
    // await this.blogRepository.deleteAll();
    // await this.postRepository.deleteAll();
    // await this.commentRepository.deleteAll();
    // await this.sessionRepository.deleteAll();
    // await this.likeStatusRepository.deleteAll();
    // await this.banRepository.deleteAll();
  }
}
