// import { IntersectionType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

// import { IsBlogExist } from '../../blog/custom-validators/customValidateBlog';

export class CreatePostDto {
  @IsNotEmpty({
    message: 'The title field is required',
  })
  @IsString({
    message: 'The title field must be a string',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(3, {
    message: 'The title field must be at least 3, got $value',
  })
  @MaxLength(30, {
    message: 'The title field must be no more than 30, got $value',
  })
  title: string;

  @IsNotEmpty({
    message: 'The shortDescription field is required',
  })
  @IsString({
    message: 'The shortDescription field must be a string',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(3, {
    message: 'The shortDescription field must be at least 3, got $value',
  })
  @MaxLength(100, {
    message: 'The shortDescription field must be no more than 100, got $value',
  })
  shortDescription: string;

  @IsNotEmpty({
    message: 'The content field is required',
  })
  @IsString({
    message: 'The content field must be a string',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(3, {
    message: 'The content field must be at least 3, got $value',
  })
  @MaxLength(1000, {
    message: 'The content field must be no more than 1000, got $value',
  })
  content: string;
}

/*export class BlogIdDto {
  @IsString()
  @IsBlogExist({
    message: 'The blog ID is not defined',
  })
  blogId: undefined;
}*/

/*export class CreatePostDto extends IntersectionType(
  CreatePostBaseDto,
  BlogIdDto,
) {}*/

export class UpdatePostDto extends CreatePostDto {}
