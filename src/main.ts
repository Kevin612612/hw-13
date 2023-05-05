import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  //create app
  const app = await NestFactory.create(AppModule);
  //allows the application to be accessed from other domains
  app.enableCors();
  //binding ValidationPipe at the application level
  app.useGlobalPipes(new ValidationPipe());
  //start app
  await app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`);
  });
}
bootstrap();
