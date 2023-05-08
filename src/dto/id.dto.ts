import { IsDefined, Validate } from 'class-validator';
import { BlogExistsValidation } from '../validation/validation';

export class BlogIdDTO {
  @IsDefined()
  // @Validate(BlogExistsValidation, { message: 'blog doesn\'t exist' })
  blogId: string;
}

export class PostIdDTO {
  @IsDefined()
  postId: string;
}

export class UserIdDTO {
  @IsDefined()
  userId: string;
}