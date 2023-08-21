import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { Request } from 'express';
import { RefreshTokenService } from '../entity_tokens/refreshtoken.service';
import { BlackListRepository } from '../entity_black_list/blacklist.repository';
import { UserRepository } from '../entity_user/user.repository';
import { LogFunctionName } from '../decorators/logger.decorator';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    @Inject(RefreshTokenService) protected refreshTokenService: RefreshTokenService,
    @Inject(BlackListRepository) protected blackListRepository: BlackListRepository,
    @Inject(UserRepository) protected userRepository: UserRepository,
  ) {}

  @LogFunctionName()
  async canActivate(context: ExecutionContext): Promise<any> {
    const request: Request = context.switchToHttp().getRequest();
    const refreshToken = request.cookies.refreshToken || null;
    //console.log('check refreshToken', refreshToken); //that string is for vercel log reading

    try {
      const payloadFromRefreshToken = await this.validateRefreshTokenAndExtractPayload(refreshToken);
      request.user = await this.userRepository.findUserById(payloadFromRefreshToken.userId);
      return true;
    } catch (error) {
			console.log('Error from RefreshTokenGuard:', error);
      throw new UnauthorizedException();
    }
  }

  private async validateRefreshTokenAndExtractPayload(refreshToken: string): Promise<any> {
    const payload = await this.refreshTokenService.getPayloadFromRefreshToken(refreshToken);
		/** Validation*/
    const isInBlackList = await this.blackListRepository.findToken(refreshToken);
    const tokenExpired = await this.refreshTokenService.isTokenExpired(payload);
    const tokenIsValid = await this.refreshTokenService.isPayloadValid(payload);

		if (!refreshToken || isInBlackList || tokenExpired || !tokenIsValid) {
			throw new UnauthorizedException();
		}
		return payload;
	}
  
}
