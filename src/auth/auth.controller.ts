import { Body, Controller, Post, HttpCode, HttpStatus, Inject, UseGuards, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { AuthGuard } from './auth.guard';
import { passwordRecoveryDTO } from './dto/passwordRecovery.dto';
import { UserDTO } from '../user/dto/userInputDTO';
import { UsersService } from '../user/users.service';
import { Response, Request } from 'express';
import { EmailService } from '../email/email.service';

import { RefreshTokensRepository } from '../tokens/refreshtoken.repository';
import { RefreshTokenService } from '../tokens/refreshtoken.service';
import { UserRepository } from '../user/users.repository';
import { BlackListService } from '../black list/blacklist.service';
import { AccessTokenService } from '../tokens/accesstoken.service';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private authService: AuthService,
    @Inject(UsersService) private usersService: UsersService,
    @Inject(EmailService) private emailService: EmailService,
    @Inject(AccessTokenService) private accessTokenService: AccessTokenService,
    @Inject(RefreshTokenService) private refreshTokenService: RefreshTokenService,
    @Inject(BlackListService) private blackListService: BlackListService,
    @Inject(RefreshTokensRepository) private refreshTokensRepository: RefreshTokensRepository,
    @Inject(UserRepository) private userRepository: UserRepository,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDTO, @Req() req: Request, @Res() res: Response) {
    //collect data from request
    const IP = req.socket.remoteAddress || 'noIp';
    const userAgent = req.headers['user-agent'];
    const deviceName = 'device';
    const deviceId = await this.refreshTokensRepository.createDeviceId();
    //create tokens
    const tokens = await this.authService.login(dto, deviceId, deviceName, IP);
    //send them
    res
      .cookie('refreshToken', tokens.refreshToken.value, {
        httpOnly: true,
        secure: false,
      })
      .status(200)
      .json(tokens.accessToken);
  }


  @Post('refresh-token')
  //CheckRefreshTokenMiddleware
  async newPairOfTokens(@Req() req: Request, @Res() res: Response) {
    //INPUT
    const refreshToken = req.cookies.refreshToken;    
    const IP = req.socket.remoteAddress || 'noIp';
    const userAgent = req.headers['user-agent'];
    const deviceName = 'device';
    const payload = await this.refreshTokenService.getPayloadFromRefreshToken(refreshToken); //once middleware is passed
    const user = await this.userRepository.findUserById(payload.userId); 
    const deviceId = payload.deviceId;
    // BLL
    // since validation is passed, so we can add refreshToken in black list
    const result = await this.blackListService.addToken(refreshToken);
    // //...and delete from DB
    const deleteRefreshToken = await this.refreshTokensRepository.deleteOne(user.id, deviceId);
    // //RETURN
    if (user) {
      //create the pair of tokens and put them into db
      const accessTokenObject = await this.accessTokenService.generateAccessJWT(user);
      const refreshTokenObject = await this.refreshTokenService.generateRefreshJWT(user, deviceId, deviceName, IP);
      //send response with tokens
      res
      .cookie('refreshToken', refreshTokenObject.value, {
        httpOnly: true,
        secure: false,
      })
      .status(200)
      .json(accessTokenObject);
    } else {
      res.sendStatus(401);
    }
  }

  @Post('password-recovery')
  async passwordRecovery(@Body() dto: passwordRecoveryDTO) {
    return await this.authService.sendRecoveryCode(dto.email);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @Post('registration-confirmation')
  async registrationConfirmation(@Body() dto, @Res() res: Response) {
    const result = await this.usersService.confirmCodeFromEmail(dto.code);
    if (!result) {
      res.sendStatus(HttpStatus.NOT_FOUND);
    } else {
      res.sendStatus(HttpStatus.NO_CONTENT);
    }
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration')
  async registration(@Body() dto: UserDTO) {
    return await this.usersService.newRegisteredUser(dto);
  }

  @Post('registration-email-resending')
  async resendRegistrationCode(@Body() dto, @Res() res: Response) {
    const result = await this.emailService.sendEmailConfirmationMessageAgain(dto.email);
    if (!result) {
      res.sendStatus(HttpStatus.NOT_FOUND);
    } else {
      res.sendStatus(HttpStatus.NO_CONTENT);
    }
  }
}
