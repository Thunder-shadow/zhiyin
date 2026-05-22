import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /** 获取/创建用户 profile（临时用固定openid） */
  @Get('profile')
  async getProfile() {
    const profile = await this.userService.getOrCreateProfile('default_user_openid');
    return { code: 0, msg: 'success', data: profile };
  }

  /** 更新用户信息 */
  @Put('profile')
  async updateProfile(@Body() body: { nick_name?: string; avatar_url?: string; grade?: string; major?: string; target_industry?: string }) {
    const profile = await this.userService.updateProfile('default_user_openid', body);
    return { code: 0, msg: 'success', data: profile };
  }
}
