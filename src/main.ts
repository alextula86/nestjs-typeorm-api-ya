import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ErrorExceptionFilter, HttpExceptionFilter } from './exception.filter';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy');
  app.enableCors();
  app.use(cookieParser());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory(errors) {
        const errorsResponce = errors.reduce((acc, e) => {
          const constraintsKeys = Object.keys(e.constraints);
          return [
            ...acc,
            ...constraintsKeys.map((ckey) => ({
              message: e.constraints[ckey],
              field: e.property,
            })),
          ];
        }, []);

        throw new BadRequestException(errorsResponce);
      },
    }),
  );
  app.useGlobalFilters(new ErrorExceptionFilter(), new HttpExceptionFilter());
  await app.listen(PORT);
}

bootstrap();
