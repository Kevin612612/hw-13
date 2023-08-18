import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { UserSchema } from './user.schema';
import { UserRepository } from './user.repository';
import { TokenModule } from '../entity_tokens/tokens.module';
import { UserExistsValidation, CodeAlreadyConfirmedValidation } from '../validation/userValidation';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]), TokenModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository, UserExistsValidation, CodeAlreadyConfirmedValidation],
  exports: [UsersService, UserRepository],
})
export class UserModule {}
