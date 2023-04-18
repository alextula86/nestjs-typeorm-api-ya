import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { jwtService } from '../application';

@Injectable()
export class AuthRefreshTokenGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request & {
      userId: string;
      deviceId: string;
      deviceIat: string;
    } = context.switchToHttp().getRequest();

    if (!request.cookies || !request.cookies.refreshToken) {
      throw new UnauthorizedException();
    }

    const refreshTokenResponse =
      await jwtService.getRefreshTokenUserIdAndDeviceId(
        request.cookies.refreshToken,
      );

    if (
      !refreshTokenResponse ||
      !refreshTokenResponse.userId ||
      !refreshTokenResponse.deviceId
    ) {
      throw new UnauthorizedException();
    }

    request.userId = refreshTokenResponse.userId;
    request.deviceId = refreshTokenResponse.deviceId;
    request.deviceIat = refreshTokenResponse.iat;

    return true;
  }
}
