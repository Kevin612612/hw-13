import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostRepository } from './post.repository';
import { BlogRepository } from '../blog/blog.repository';
import { PostExistsValidation } from '../validation/validation';
import { Blog, BlogSchema } from '../blog/blog.schema';
import { Post, PostSchema } from './post.schema';
import { TokenModule } from '../tokens/tokens.module';
import { UserModule } from '../user/user.module';
import { BlackListModule } from '../black list/blacklist.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Blog.name, schema: BlogSchema },
    ]),
    TokenModule,
    UserModule,
    BlackListModule,
    CommentsModule
  ],
  controllers: [PostController],
  providers: [PostService, PostRepository, PostExistsValidation, BlogRepository],
  exports: [PostService, PostRepository],
})
export class PostModule {}
