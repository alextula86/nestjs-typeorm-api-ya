import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

import { Transform } from 'class-transformer';

export class AuthUserDto {
  @IsNotEmpty({
    message: 'The loginOrEmail field is required',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(3, {
    message: 'The loginOrEmail field must be at least 3, got $value',
  })
  loginOrEmail: string;

  @IsNotEmpty({
    message: 'The password field is required',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(6, {
    message: 'The password field must be at least 3, got $value',
  })
  @MaxLength(20, {
    message: 'The password field must be no more than 10, got $value',
  })
  password: string;
}
