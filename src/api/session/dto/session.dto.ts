import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty({
    message: 'The ip field is required',
  })
  @IsString({
    message: 'The ip field must be a string',
  })
  ip: string;

  @IsNotEmpty({
    message: 'The deviceTitle field is required',
  })
  @IsString({
    message: 'The deviceTitle field must be a string',
  })
  deviceTitle: string;

  @IsNotEmpty({
    message: 'The url field is required',
  })
  @IsString({
    message: 'The url field must be a string',
  })
  url: string;
}
