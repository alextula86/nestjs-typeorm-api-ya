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
        wallpapers,
        blog_main_images,
        blog_subscription,
        post_main_images,
        post_like_status,
        integrations,
        posts,
        blogs,
        quiz_questions,
        quiz_question_answer,
        pair_quiz_game,
        pair_quiz_game_result,
        pair_quiz_game_bonus,
        users;
    `);
  }
}
