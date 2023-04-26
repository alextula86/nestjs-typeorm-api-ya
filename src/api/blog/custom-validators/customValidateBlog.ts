import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { BlogService } from '../blog.service';

@ValidatorConstraint({ name: 'IsBlogExist', async: true })
@Injectable()
export class IsBlogExistConstraint implements ValidatorConstraintInterface {
  constructor(private blogService: BlogService) {}

  async validate(value: string): Promise<boolean> {
    try {
      const foundBlog = await this.blogService.findBlogById(value);

      if (!foundBlog) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  defaultMessage(): string {
    return 'The blog ID is not defined';
  }
}

export function IsBlogExist(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsBlogExistConstraint,
    });
  };
}
