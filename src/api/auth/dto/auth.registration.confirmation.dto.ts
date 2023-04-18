import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegistrationConfirmationDto {
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
  code: string;
}
