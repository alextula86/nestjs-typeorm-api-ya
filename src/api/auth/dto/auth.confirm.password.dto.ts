import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class ConfirmPasswordDto {
  @IsNotEmpty({
    message: 'The code field is required',
  })
  @IsString({
    message: 'The code field must be a string',
  })
  @Transform(({ value }) => value.trim())
  @IsUUID('all', {
    message: 'The code is incorrectly',
  })
  recoveryCode: string;

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
  newPassword: string;
}
