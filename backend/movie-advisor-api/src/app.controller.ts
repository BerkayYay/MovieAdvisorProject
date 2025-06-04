import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return {
      status: 'OK',
      message: 'Movie Advisor API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        auth: '/auth/login',
        register: '/auth/register',
        profile: '/auth/profile',
      },
    };
  }
}
