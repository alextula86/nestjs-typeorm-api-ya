import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadGatewayException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Request } from 'express';

// import { SessionService } from '../api/session/session.service';
/*import {
  CreateSessionCommand,
  IncreaseAttemptSessionCommand,
  ResetAttemptSessionCommand,
} from '../api/session/use-cases';*/

@Injectable()
export class AuthCountRequestsGuard implements CanActivate {
  constructor(
    // private readonly sessionService: SessionService,
    private readonly commandBus: CommandBus,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const url = request.url;
    const deviceTitle = request.headers['user-agent'] || '';

    const limitSecondsRate = 10;
    const maxAttemps = 5;

    /*const foundSession = await this.sessionService.findSession(
      ip,
      url,
      deviceTitle,
    );*/

    /*if (!foundSession) {
      await this.commandBus.execute(
        new CreateSessionCommand({ ip, url, deviceTitle }),
      );
      return true;
    }*/

    /*const currentLocalDate = Date.now();
    const sessionDate = new Date(foundSession.issuedAtt).getTime();
    const diffSeconds = (currentLocalDate - sessionDate) / 1000;

    if (diffSeconds > limitSecondsRate) {
      await this.commandBus.execute(
        new ResetAttemptSessionCommand(foundSession.id),
      );
      return true;
    }

    const response = await this.commandBus.execute(
      new IncreaseAttemptSessionCommand(foundSession.id),
    );

    if (!response) {
      throw new BadGatewayException();
    }

    if (response.attempt > maxAttemps) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }*/

    return true;
  }
}
