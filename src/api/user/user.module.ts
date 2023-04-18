import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { CqrsModule } from '@nestjs/cqrs';

// import { UserController } from './user.controller';
// import { UserService } from './user.service';
// import { CreateUserUseCase, BanUserUseCase } from './use-cases';
// import { CreateSqlUserUseCase } from './use-cases';
// import { UserSqlRepository } from './user.sql.repository';
// import { UserQueryRepository } from './user.query.repository';

// const useCases = [CreateSqlUserUseCase];

@Module({
  // imports: [TypeOrmModule.forRoot(), UsersModule, CqrsModule],
  // imports: [CqrsModule],
  // controllers: [UserController],
  // providers: [UserService, UserSqlRepository, ...useCases],
})
export class UserModule {}
