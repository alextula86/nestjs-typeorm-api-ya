import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Controller('api/testing')
export class TestingController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}
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
        quiz_questions,
        users;
    `);
  }
}
