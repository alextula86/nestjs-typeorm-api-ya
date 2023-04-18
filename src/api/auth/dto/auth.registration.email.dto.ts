import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegistrationEmailDto {
  @IsNotEmpty({
    message: 'The email field is required',
  })
  @IsString({
    message: 'The email field must be a string',
  })
  @Transform(({ value }) => value.trim())
  @IsEmail()
  email: string;
}
