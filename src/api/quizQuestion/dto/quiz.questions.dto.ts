import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Transform } from 'class-transformer';
import { isString } from 'lodash';
import { PublishedStatus } from '../../../types';

export class CreateQuizQuestionDto {
  @IsNotEmpty({
    message: 'The body field is required',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(10, {
    message: 'The body field must be at least 10, got $value',
  })
  @MaxLength(500, {
    message: 'The body field must be no more than 500, got $value',
  })
  body: string;

  @ArrayNotEmpty({
    message: 'The correctAnswers field is required',
  })
  @IsArray({
    message: 'The correctAnswers field is array',
  })
  @ArrayMinSize(1, {
    message: 'The correctAnswers field must be at least 1',
  })
  @Transform(({ value }) =>
    value.map((i: any) => (!isString(i) ? String(i) : i)),
  )
  correctAnswers: string[];
}

export class UpdateQuizQuestionDto extends CreateQuizQuestionDto {}

export class PublishQuizQuestionDto {
  @IsEnum(PublishedStatus)
  published: PublishedStatus;
}
