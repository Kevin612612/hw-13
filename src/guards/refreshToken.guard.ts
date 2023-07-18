import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { Request } from 'express';
import { RefreshTokenService } from '../tokens/refreshtoken.service';
import { BlackListRepository } from '../black list/blacklist.repository';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    @Inject(RefreshTokenService) protected refreshTokenService: RefreshTokenService,
    @Inject(BlackListRepository) protected blackListRepository: BlackListRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<any> {
    const request: Request = context.switchToHttp().getRequest();

    try {
      const refreshToken = request.cookies.refreshToken || null;
      console.log('check refreshToken', refreshToken);
      if (!refreshToken) throw new UnauthorizedException();
      const payload = await this.refreshTokenService.getPayloadFromRefreshToken(refreshToken);
      const isInBlackList = await this.blackListRepository.findToken(refreshToken);
      if (isInBlackList) throw new UnauthorizedException();
      const isValid = await this.refreshTokenService.isPayloadValid(payload);
      if (!isValid) throw new UnauthorizedException();
      const expired = await this.refreshTokenService.isTokenExpired(payload);
      if (expired) throw new UnauthorizedException();
      return true;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
  }
}
