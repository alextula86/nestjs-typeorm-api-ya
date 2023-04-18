import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthdBasicGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException();
    }

    const [authType, authInBase64] = authorization.split(' ');
    const authToString = Buffer.from(authInBase64, 'base64').toString('utf8');
    const [login, password] = authToString.split(':');

    if (
      authType !== 'Basic' ||
      login !== process.env.LOGIN ||
      password !== process.env.PASSWORD
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
