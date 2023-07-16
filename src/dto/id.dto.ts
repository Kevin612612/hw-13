import { IsDefined, IsEnum, Validate } from 'class-validator';
import { BlogExistsValidation, CommentExistsValidation, PostExistsValidation, UserExistsValidation } from '../validation/validation';

export class UserIdDTO {
  @IsDefined()
  @Validate(UserExistsValidation)
  userId: string;
}

export class BlogIdDTO {
  @Validate(BlogExistsValidation)
  blogId: string;
}

export class PostIdDTO {
  @Validate(PostExistsValidation)
  postId: string;
}

export class CommentIdDTO {
  @Validate(CommentExistsValidation)
  commentId: string;
}

export class LikeStatusDTO {
  @IsEnum({
    Like: 'Like',
    Dislike: 'Dislike',
    None: 'None',
  })
  likeStatus: string;
}
