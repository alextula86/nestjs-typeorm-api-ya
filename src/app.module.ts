import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import {
  Users,
  EmailConfirmation,
  PasswordRecovery,
  BanUserInfo,
} from './api/user/entities';
import { Blogs } from './api/blog/entities';
import { Posts } from './api/post/entities';
import { Comments } from './api/comment/entities';
import { Devices } from './api/device/entities';
import { Sessions } from './api/session/entities';
import { CommentLikeStatus } from './api/commentLikeStatus/entities';
import { PostLikeStatus } from './api/postLikeStatus/entities';
import { BanUserForBlog } from './api/ban/entities';
import { QuizQuestions } from './api/quizQuestion/entities';
import { QuizQuestionAnswer } from './api/quizQuestionAnswers/entities';
import { PairQuizGame } from './api/pairQuizGame/entities';
import { PairQuizGameResult } from './api/pairQuizGameResult/entities';
import { PairQuizGameBonus } from './api/pairQuizGameBonus/entities';
import { Wallpapers } from './api/wallpaper/entities';
import { BlogMainImages } from './api/blogMainImage/entities';
import { PostMainImages } from './api/postMainImage/entities';

import { AuthController } from './api/auth/auth.controller';
import { UserController } from './api/user/user.controller';
import { BlogController } from './api/blog/blog.controller';
import { BloggerController } from './api/blog/blogger.controller';
import { SABlogController } from './api/blog/sa-blog.controller';
import { PostController } from './api/post/post.controller';
import { DeviceSqlController } from './api/device/device.controller';
import { CommentController } from './api/comment/comment.controller';
import { QuizQuestionController } from './api/quizQuestion/quizQuestion.controller';
import { PairQuizGameController } from './api/pairQuizGame/pairQuizGame.controller';
import { TestingController } from './api/testing/testing.controller';

import { AuthService } from './api/auth/auth.service';
import { BlogService } from './api/blog/blog.service';
import { PostService } from './api/post/post.service';
import { CommentService } from './api/comment/comment.service';
import { DeviceService } from './api/device/device.service';
import { SessionService } from './api/session/session.service';
import { CommentLikeStatusService } from './api/commentLikeStatus/commentlikeStatus.service';
import { PostLikeStatusService } from './api/postLikeStatus/postLikeStatus.service';
import { QuizQuestionService } from './api/quizQuestion/quizQuestion.service';
import { WallpaperService } from './api/wallpaper/wallpaper.service';
import { BlogMainImageService } from './api/blogMainImage/blogMainImage.service';
import { PostMainImageService } from './api/postMainImage/postMainImage.service';

import {
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  RegisterUserUseCase,
  RegistrationConfirmationUseCase,
  RegistrationEmailResendingUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
} from './api/auth/use-cases';
import {
  CreateUserUseCase,
  DeleteUserUseCase,
  BanUserUseCase,
} from './api/user/use-cases';
import {
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  BindWithUserBlogUseCase,
  BanBlogUseCase,
  BanUserForBlogUseCase,
} from './api/blog/use-cases';
import {
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
} from './api/post/use-cases';
import {
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
} from './api/comment/use-cases';
import {
  DeleteAllDevicesUseCase,
  DeleteDeviceByIdUseCase,
} from './api/device/use-cases';
import {
  CreateSessionUseCase,
  IncreaseAttemptSessionUseCase,
  ResetAttemptSessionUseCase,
} from './api/session/use-cases';
import { UpdateLikeStatusCommentUseCase } from './api/commentLikeStatus/use-cases';
import { UpdateLikeStatusPostUseCase } from './api/postLikeStatus/use-cases';
import {
  CreateQuizQuestionUseCase,
  UpdateQuizQuestionUseCase,
  DeleteQuizQuestionUseCase,
  PublishQuizQuestionUseCase,
} from './api/quizQuestion/use-cases';
import { ConnectionPairQuizGameUseCase } from './api/pairQuizGame/use-cases';
import { CreateQuizQuestionAnswerUseCase } from './api/quizQuestionAnswers/use-cases';
import { SaveWallpaperByBlogUseCase } from './api/wallpaper/use-cases';
import { SaveBlogMainImageUseCase } from './api/blogMainImage/use-cases';
import { SavePostMainImageUseCase } from './api/postMainImage/use-cases';

import { UserRepository } from './api/user/user.repository';
import { BlogRepository } from './api/blog/blog.repository';
import { PostRepository } from './api/post/post.repository';
import { CommentRepository } from './api/comment/comment.repository';
import { DeviceRepository } from './api/device/device.repository';
import { SessionRepository } from './api/session/session.repository';
import { CommentLikeStatusRepository } from './api/commentLikeStatus/commentLikeStatus.repository';
import { PostLikeStatusRepository } from './api/postLikeStatus/postLikeStatus.repository';
import { BanRepository } from './api/ban/ban.repository';
import { QuizQuestionRepository } from './api/quizQuestion/quizQuestion.repository';
import { QuizQuestionAnswerRepository } from './api/quizQuestionAnswers/quizQuestionAnswer.repository';
import { PairQuizGameRepository } from './api/pairQuizGame/pairQuizGame.repository';
import { PairQuizGameResultRepository } from './api/pairQuizGameResult/pairQuizGameResult.repository';
import { PairQuizGameBonusRepository } from './api/pairQuizGameBonus/pairQuizGameBonus.repository';
import { WallpaperRepository } from './api/wallpaper/wallpaper.repository';
import { BlogMainImageRepository } from './api/blogMainImage/blogMainImage.repository';
import { PostMainImageRepository } from './api/postMainImage/postMainImage.repository';

import { UserQueryRepository } from './api/user/user.query.repository';
import { BlogQueryRepository } from './api/blog/blog.query.repository';
import { PostQueryRepository } from './api/post/post.query.repository';
import { CommentQueryRepository } from './api/comment/comment.query.repository';
import { DeviceQueryRepository } from './api/device/device.query.repository';
import { AuthQueryRepository } from './api/auth/auth.query.repository';
import { BanQueryRepository } from './api/ban/ban.query.repository';
import { QuizQuestionQueryRepository } from './api/quizQuestion/quizQuestion.query.repository';
import { QuizQuestionAnswerQueryRepository } from './api/quizQuestionAnswers/quizQuestionAnswer.query.repository';
import { PairQuizGameQueryRepository } from './api/pairQuizGame/pairQuizGame.query.repository';
import { WallpaperQueryRepository } from './api/wallpaper/wallpaper.query.repository';
import { BlogMainImageQueryRepository } from './api/blogMainImage/blogMainImage.query.repository';
import { PostMainImageQueryRepository } from './api/postMainImage/postMainImage.query.repository';

import { EmailAdapter, S3StorageAdapter, SharpAdapter } from './adapters';
import { EmailManager } from './managers';
import { IsBlogExistConstraint } from './api/blog/custom-validators/customValidateBlog';

const authProviders = [
  AuthService,
  AuthQueryRepository,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  RegisterUserUseCase,
  RegistrationConfirmationUseCase,
  RegistrationEmailResendingUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
];
const userProviders = [
  // UserService,
  UserRepository,
  UserQueryRepository,
  CreateUserUseCase,
  DeleteUserUseCase,
  BanUserUseCase,
];
const blogProviders = [
  IsBlogExistConstraint,
  BlogService,
  BlogRepository,
  BlogQueryRepository,
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  BindWithUserBlogUseCase,
  BanBlogUseCase,
  BanUserForBlogUseCase,
];
const postProviders = [
  PostService,
  PostRepository,
  PostQueryRepository,
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
];
const commentProviders = [
  CommentService,
  CommentRepository,
  CommentQueryRepository,
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
];
const deviceProviders = [
  DeviceService,
  DeviceRepository,
  DeviceQueryRepository,
  DeleteAllDevicesUseCase,
  DeleteDeviceByIdUseCase,
];
const sessionProviders = [
  SessionService,
  SessionRepository,
  CreateSessionUseCase,
  IncreaseAttemptSessionUseCase,
  ResetAttemptSessionUseCase,
];
const commentLikeStatusProviders = [
  CommentLikeStatusService,
  CommentLikeStatusRepository,
  UpdateLikeStatusCommentUseCase,
];
const postLikeStatusProviders = [
  PostLikeStatusService,
  PostLikeStatusRepository,
  UpdateLikeStatusPostUseCase,
];
const banSProviders = [BanRepository, BanQueryRepository];
const quizQuestionProviders = [
  QuizQuestionService,
  QuizQuestionRepository,
  QuizQuestionQueryRepository,
  CreateQuizQuestionUseCase,
  UpdateQuizQuestionUseCase,
  DeleteQuizQuestionUseCase,
  PublishQuizQuestionUseCase,
];
const quizQuestionAnswerProviders = [
  QuizQuestionAnswerRepository,
  QuizQuestionAnswerQueryRepository,
  CreateQuizQuestionAnswerUseCase,
];
const pairQuizGameProviders = [
  PairQuizGameRepository,
  PairQuizGameQueryRepository,
  ConnectionPairQuizGameUseCase,
];

const pairQuizGameResultProviders = [PairQuizGameResultRepository];

const pairQuizGameBonusProviders = [PairQuizGameBonusRepository];

const wallpaperProviders = [
  WallpaperService,
  WallpaperRepository,
  WallpaperQueryRepository,
  SaveWallpaperByBlogUseCase,
];

const blogMainImageProviders = [
  BlogMainImageService,
  BlogMainImageRepository,
  BlogMainImageQueryRepository,
  SaveBlogMainImageUseCase,
];

const postMainImageProviders = [
  PostMainImageService,
  PostMainImageRepository,
  PostMainImageQueryRepository,
  SavePostMainImageUseCase,
];

const adapters = [EmailManager, EmailAdapter, S3StorageAdapter, SharpAdapter];

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'kandula.db.elephantsql.com',
      port: 5432,
      username: 'lmxvapgr',
      password: 's22x3YZbf6AiJISG1ehaj7k4TFs1h-Ih',
      database: 'lmxvapgr',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      Users,
      EmailConfirmation,
      PasswordRecovery,
      BanUserInfo,
      Devices,
      Sessions,
      Blogs,
      Posts,
      Comments,
      CommentLikeStatus,
      PostLikeStatus,
      BanUserForBlog,
      QuizQuestions,
      QuizQuestionAnswer,
      PairQuizGame,
      PairQuizGameResult,
      PairQuizGameBonus,
      Wallpapers,
      BlogMainImages,
      PostMainImages,
    ]),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: 'a.marcuk2023@gmail.com',
          pass: 'suflbzalydymjqnt',
        },
      },
      defaults: {
        from: '"nestjs-mongoose-api-ya" <a.marcuk2023@gmail.com>',
      },
    }),
    CqrsModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    BlogController,
    BloggerController,
    SABlogController,
    PostController,
    CommentController,
    DeviceSqlController,
    QuizQuestionController,
    PairQuizGameController,
    TestingController,
  ],
  providers: [
    AppService,
    ...authProviders,
    ...userProviders,
    ...blogProviders,
    ...postProviders,
    ...commentProviders,
    ...deviceProviders,
    ...sessionProviders,
    ...commentLikeStatusProviders,
    ...postLikeStatusProviders,
    ...banSProviders,
    ...quizQuestionProviders,
    ...quizQuestionAnswerProviders,
    ...pairQuizGameProviders,
    ...pairQuizGameResultProviders,
    ...pairQuizGameBonusProviders,
    ...wallpaperProviders,
    ...blogMainImageProviders,
    ...postMainImageProviders,
    ...adapters,
  ],
})
export class AppModule {}
