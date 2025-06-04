import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for React Native app
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;

  // Listen on all network interfaces (0.0.0.0) to allow Android emulator access
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Movie Advisor API running on http://localhost:${port}`);
}
bootstrap();
