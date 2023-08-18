import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { getClassName } from '../secondary functions/getFunctionName';

@Injectable()
export class MyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const logger = new Logger(getClassName());
    logger.log(`${request.method}-request to ${request.url}`)
    return next.handle();
  }
}
