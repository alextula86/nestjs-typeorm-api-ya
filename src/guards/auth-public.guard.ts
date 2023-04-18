import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { jwtService } from '../application';

@Injectable()
export class AuthPublicGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request & { userId: string } = context
      .switchToHttp()
      .getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      return true;
    }

    const [authType, authToken] = authorization.split(' ');
    const userId = await jwtService.getUserIdByAccessToken(authToken);

    if (authType !== 'Bearer' || !userId) {
      return true;
    }

    request.userId = userId;

    return true;
  }
}
