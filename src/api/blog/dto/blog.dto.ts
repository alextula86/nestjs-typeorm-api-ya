import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Transform } from 'class-transformer';
import { IsBlogExist } from '../custom-validators/customValidateBlog';

export class CreateBlogDto {
  @IsNotEmpty({
    message: 'The name field is required',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(3, {
    message: 'The name field must be at least 3, got $value',
  })
  @MaxLength(15, {
    message: 'The name field must be no more than 15, got $value',
  })
  name: string;

  @IsNotEmpty({
    message: 'The description field is required',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(3, {
    message: 'The description field must be at least 3, got $value',
  })
  @MaxLength(500, {
    message: 'The description field must be no more than 500, got $value',
  })
  description: string;

  @IsNotEmpty({
    message: 'The websiteUrl field is required',
  })
  @Transform(({ value }) => value.trim())
  @MaxLength(100, {
    message: 'The websiteUrl field must be no more than 100, got $value',
  })
  @IsUrl()
  websiteUrl: string;
}

export class UpdateBlogDto extends CreateBlogDto {}

export class BanBlogDto {
  @IsNotEmpty({
    message: 'The isBanned field is required',
  })
  @IsBoolean({
    message: 'The isBanned field contains a logical type',
  })
  isBanned: boolean;
}

export class BanUserDto {
  @IsString()
  @IsNotEmpty({
    message: 'The blogId field is required',
  })
  @IsBlogExist()
  blogId: string;

  @IsNotEmpty({
    message: 'The isBanned field is required',
  })
  @IsBoolean({
    message: 'The isBanned field contains a logical type',
  })
  isBanned: boolean;

  @IsString()
  @IsNotEmpty({
    message: 'The banReason field is required',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(20, {
    message: 'The banReason field must be at least 20, got $value',
  })
  banReason: string;
}
