import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: User) {
    return await this.profileService.getProfile(user.id);
  }

  @Put()
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return await this.profileService.updateProfile(user.id, updateProfileDto);
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.profileService.changePassword(user.id, changePasswordDto);
  }

  @Delete('deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateAccount(@CurrentUser() user: User) {
    return await this.profileService.deactivateAccount(user.id);
  }

  @Put('reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivateAccount(@CurrentUser() user: User) {
    return await this.profileService.reactivateAccount(user.id);
  }
}
