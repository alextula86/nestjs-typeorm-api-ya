import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @IsNotEmpty({
    message: 'The content field is required',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(20, {
    message: 'The content field must be at least 20, got $value',
  })
  @MaxLength(300, {
    message: 'The content field must be no more than 300, got $value',
  })
  content: string;
}

export class UpdateCommentDto extends CreateCommentDto {}
