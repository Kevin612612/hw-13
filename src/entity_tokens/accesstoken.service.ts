import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../entity_user/user.repository';
import { UserDataType } from '../types/users';
import { AccessTokensPayloadType } from '../types/accesstoken';
import { ConfigService } from '@nestjs/config';

//(1) generateAccessJWT
//(2) getPayloadFromAccessToken
//(3) isPayloadValid
//(4) isTokenExpired

@Injectable()
export class AccessTokenService {
  private accessTokenLifeTime: string;

	constructor(
		@Inject(JwtService) private jwtService: JwtService,
		@Inject(UserRepository) protected userRepository: UserRepository,
		@Inject(ConfigService) protected configService: ConfigService,
	) {
    this.accessTokenLifeTime = this.configService.get('ACCESS_TOKEN_LIFE_TIME');
  }

	//(1) generate accesstoken
	async generateAccessJWT(user: UserDataType) {
		console.log('generating access jwt')
		const liveTimeInSeconds: number = parseInt(this.accessTokenLifeTime);
		console.log(liveTimeInSeconds);
		const payload = {
			loginOrEmail: user.accountData.login,
			sub: user.id,
			expiresIn: liveTimeInSeconds,
		};
		console.log(payload);

		const accessToken = await this.jwtService.signAsync(payload, {
			expiresIn: liveTimeInSeconds,
		});
		console.log(accessToken);

		//put it into db
		const addAccessToken = await this.userRepository.addAccessToken(user.id, accessToken, liveTimeInSeconds);

		return { accessToken: accessToken };
	}

	//(2) retrieve payload from accessToken
	async getPayloadFromAccessToken(accessToken: string): Promise<AccessTokensPayloadType> {
		return await this.jwtService.verifyAsync(accessToken);
	}

	//(3) check type of payload
	async isPayloadValid(payload: any): Promise<boolean> {
    const requiredKeys = ['loginOrEmail', 'sub', 'expiresIn', 'iat', 'exp'];
    return requiredKeys.every(key => payload.hasOwnProperty(key));
}

	//(4) check token expiration
	async isTokenExpired(payload: any): Promise<boolean> {
		const currentTime = Math.floor(Date.now() / 1000); // Convert current time to seconds
		if (payload.iat && payload.expiresIn) {
			const expirationTime: number = payload.iat + parseInt(payload.expiresIn, 10);
			return currentTime >= expirationTime;
		}
		return true; // If the token payload doesn't have expiresIn, consider it as expired
	}
}
