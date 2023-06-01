import { IsNotEmpty, IsString } from 'class-validator';

import { Transform } from 'class-transformer';

export class AnswerPairQuizGameDto {
  @IsNotEmpty({
    message: 'The answer field is required',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  answer: string;
}
