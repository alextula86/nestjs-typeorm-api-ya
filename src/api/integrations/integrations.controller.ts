import {
  Controller,
  Get,
  Req,
  // NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthBearerGuard } from '../../guards';

@Controller('api/integrations')
export class IntegrationsBlogController {
  constructor(private readonly commandBus: CommandBus) {}
  @Get('telegram/auth-bot-link')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.OK)
  async getAuthBotLink(
    @Req() request: Request & { userId: string },
  ): Promise<{ link: string }> {
    return {
      link: 'https://t.me/BotBotBot?code=123',
    };
  }
  @Post(':blogId/subscription')
  @UseGuards(AuthBearerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async blogSubscription(
    @Req() request: Request & { userId: string },
  ): Promise<boolean> {
    return true;
  }
}
