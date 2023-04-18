import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { AuthdBasicGuard } from '../../guards';
import { ResponseViewModelDetail } from '../../types';

import {
  CreateUserCommand,
  DeleteUserCommand,
  BanUserCommand,
} from './use-cases';
// import { UserService } from './user.service';
import { UserQueryRepository } from './user.query.repository';
import { BanUserDto, CreateUserDto } from './dto/user.dto';
import { QueryUserModel, UserViewModel } from './types';

@UseGuards(AuthdBasicGuard)
@Controller('api/sa/users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    // private readonly userService: UserService,
    private readonly userQueryRepository: UserQueryRepository,
  ) {}
  // Получение списка пользователей
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllUsers(
    @Query() queryUserModel: QueryUserModel,
  ): Promise<ResponseViewModelDetail<UserViewModel>> {
    const allUsers = await this.userQueryRepository.findAllUsers(
      queryUserModel,
    );

    return allUsers;
  }
  // Создание пользователя
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserViewModel> {
    // Создаем пользователя
    const { userId, statusCode, statusMessage } = await this.commandBus.execute(
      new CreateUserCommand(createUserDto),
    );
    // Если при создании пользователя возникли ошибки возращаем статус и текст ошибки
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
    // Порлучаем созданного пользователя в формате ответа пользователю
    const foundUser = await this.userQueryRepository.findUserById(userId);
    // Возвращаем созданного пользователя
    return foundUser;
  }
  // Удалить пользователя
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param('userId') userId: string): Promise<boolean> {
    // Удаляем пользователя
    const { statusCode } = await this.commandBus.execute(
      new DeleteUserCommand(+userId),
    );
    // Если пользователь не найден, возвращаем ошибку 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }
    // Ввозвращаем true
    return true;
  }
  // Бан пользователя
  @Put(':userId/ban')
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUser(
    @Param('userId') userId: number,
    @Body() banUserDto: BanUserDto,
  ): Promise<void> {
    // Баним пользователя
    const { statusCode } = await this.commandBus.execute(
      new BanUserCommand(userId, banUserDto),
    );
    // Если при бане пользователя возникли ошибки возращаем статус и текст ошибки
    if (statusCode === HttpStatus.UNAUTHORIZED) {
      throw new UnauthorizedException();
    }
  }
}
