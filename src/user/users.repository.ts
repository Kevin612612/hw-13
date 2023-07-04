import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';
import { UserDataType } from '../types/users';
import add from 'date-fns/add';

//(1)    allUsers
//(1.1)  countAllUsers
//(2)    createUser
//(3)    deleteUserById
//(3.1)  deleteAllUsers
//(4)    findUserByLoginOrEmail
//(4.1)  findUserById
//(5)    findUserByLogin
//(5.1)  findUserByEmail
//(6)    findUserByPasswordCode
//(7)    returns user by code
//(8)    update status
//(9)    update code
//(10)   update date when the code was sent
//(11)   update salt and hash
//(12)   add accessToken into db
//(13)   add refreshToken into db
//(14)   add code
//(15)   set refreshToken expired

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUserId() {
    let userId = 1;
    while (userId) {
      const user = await this.userModel.findOne({ id: userId.toString() });
      if (!user) {
        break;
      }
      userId++;
    }
    return userId.toString();
  }

  //(1) method returns array of users with filter
  async findAll(filter: any, sortBy: string, sortDirection: string): Promise<UserDataType[]> {
    const order = sortDirection == 'desc' ? -1 : 1;

    const items = await this.userModel
      .find(filter)
      .sort({ [sortBy]: order })
      .exec();
    return items;
  }

  //(1.1) method returns count of users with filter
  async countAllUsers(filter: any) {
    return await this.userModel.countDocuments(filter);
  }

  //(2) method creates user
  async createUser(userObject: User): Promise<UserDataType> {
    const createdUser = new this.userModel(userObject);
    return await createdUser.save();
  }

  //(3) method  deletes user by Id
  async deleteUserById(userId: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ id: userId });
    return result.acknowledged;
  }

  //(3.1) method deletes all users
  async deleteAll(): Promise<number> {
    const result = await this.userModel.deleteMany({});
    return result.deletedCount;
  }

  //(4) method returns user by loginOrEmail
  async findUserByLoginOrEmail(loginOrEmail: string): Promise<UserDataType | undefined> {
    return await this.userModel.findOne({
      $or: [{ 'accountData.login': { $regex: loginOrEmail } }, { 'accountData.email': { $regex: loginOrEmail } }],
    });
  }

  //(4.1) method returns user by Id
  async findUserById(userId: string): Promise<UserDataType | undefined> {
    return await this.userModel.findOne({ id: userId }).exec();
  }

  //(5) find user by login
  async findUserByLogin(login: string): Promise<UserDataType | undefined> {
    return await this.userModel.findOne({ 'accountData.login': { $regex: login } }, { maxTimeMS: 30000 });
  }

  //(5.1) find user by email
  async findUserByEmail(email: string): Promise<UserDataType | undefined> {
    return await this.userModel.findOne({ 'accountData.email': { $regex: email } }, { maxTimeMS: 30000 });
  }

  //(6) find user by passwordCode
  async findUserByPasswordCode(code: string): Promise<UserDataType | undefined> {
    const result = await this.userModel.findOne({ 'passwordConfirmation.confirmationCode': code }, { maxTimeMS: 30000 });
    return result ? result : undefined;
  }

  //(7) method returns user by code
  async findUserByCode(code: string): Promise<UserDataType | undefined> {
    return await this.userModel.findOne({ emailCodes: { $elemMatch: { code: code } } });
  }

  //(8) method update status
  async updateStatus(user: UserDataType): Promise<boolean> {
    const result = await this.userModel.updateOne({ id: user.id }, { $set: { 'emailConfirmation.isConfirmed': true } });
    return result.matchedCount === 1;
  }

  //(9) method update code and PUSH every new code into array
  async updateCode(user: UserDataType, code: string): Promise<boolean> {
    const result = await this.userModel.updateOne(
      { 'accountData.login': user.accountData.login },
      { $set: { 'emailConfirmation.confirmationCode': code } },
    );
    const result1 = await this.userModel.updateOne(
      { id: user.id },
      { $push: { emailCodes: { code: code, sentAt: new Date().toISOString() } } },
    );
    return result.matchedCount === 1;
  }

  //(10) method update the date when the FIRST CODE was sent
  async updateDate(userId: string, code: string): Promise<boolean> {
    const result = await this.userModel.updateOne(
      { id: userId },
      { $set: { emailCodes: [{ code: code, sentAt: new Date().toISOString() }] } },
    );
    return result.matchedCount === 1;
  }

  //(11) update salt and hash
  async updateSaltAndHash(userId: string, newPasswordSalt: string, newPasswordHash: string): Promise<boolean> {
    const result = await this.userModel.updateOne(
      { id: userId },
      {
        'accountData.passwordSalt': newPasswordSalt,
        'accountData.passwordHash': newPasswordHash,
      },
    );
    return true;
  }

  //(12) method add accessToken into userModel
  async addAccessToken(userId: string, token: string, liveTimeInSeconds: number): Promise<boolean> {
    const result = await this.userModel.findOneAndUpdate(
      { id: userId },
      {
        $push: {
          'tokens.accessTokens': {
            value: token,
            createdAt: new Date().toISOString(),
            expiredAt: new Date(new Date().getTime() + liveTimeInSeconds * 1000).toISOString(),
          },
        },
      },
    );
    return true;
  }

  //(13) method add refreshToken into db
  async addRefreshToken(userId, token: string, liveTime: number): Promise<boolean> {
    const result = await this.userModel.findOneAndUpdate(
      { id: userId },
      {
        $push: {
          'tokens.refreshTokens': {
            value: token,
            createdAt: new Date().toISOString(),
            expiredAt: new Date(new Date().getTime() + liveTime * 1000).toISOString(),
          },
        },
      },
    );
    return true;
  }

  //(14) add code into user
  async addCode(user: UserDataType | undefined, recoveryCode: string): Promise<boolean> {
    const result1 = await this.userModel.findOneAndUpdate(
      { id: user.id },
      {
        $push: {
          passwordCodes: {
            code: recoveryCode,
            sentAt: new Date().toISOString(),
          },
        },
      },
    );
    const result2 = await this.userModel.findOneAndUpdate(
      { id: user.id },
      {
        'passwordConfirmation.confirmationCode': recoveryCode,
        'passwordConfirmation.expirationDate': add(new Date(), {
          hours: 10,
          minutes: 3,
        }).toISOString(),
      },
    );
    return true;
  }

  //(15) method set refreshToken expired
  async setRefreshTokenExpired(user: UserDataType): Promise<boolean> {
    const result = await this.userModel.findOneAndUpdate(
      { id: user.id },
      {
        'tokens.refreshTokens': [],
      },
    );
    return true;
  }
}
