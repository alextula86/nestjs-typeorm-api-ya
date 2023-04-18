import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { jwtService } from '../application';

@Injectable()
export class AuthBearerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request & { userId: string } = context
      .switchToHttp()
      .getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException();
    }

    const [authType, authToken] = authorization.split(' ');
    const userId = await jwtService.getUserIdByAccessToken(authToken);

    if (authType !== 'Bearer' || !userId) {
      throw new UnauthorizedException();
    }

    request.userId = userId;

    return true;
  }
}
