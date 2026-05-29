import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { HrCandidateService } from './hr-candidate.service';

@Controller('hr-candidates')
export class HrCandidateController {
  constructor(private readonly hrCandidateService: HrCandidateService) {}

  /** 获取候选人列表 */
  @Get()
  async list() {
    const data = await this.hrCandidateService.list('default_user_openid');
    return { code: 0, msg: 'success', data };
  }

  /** 获取单个候选人详情 */
  @Get(':id')
  async detail(@Param('id') id: string) {
    const data = await this.hrCandidateService.detail('default_user_openid', id);
    if (!data) return { code: 404, msg: '候选人不存在', data: null };
    return { code: 0, msg: 'success', data };
  }

  /** 创建候选人 */
  @Post()
  async create(@Body() body: {
    name: string;
    school: string;
    major: string;
    background?: string;
    personality?: string;
    real_level?: string;
    summary?: string;
    tag?: string;
    color?: string;
  }) {
    const data = await this.hrCandidateService.create('default_user_openid', body);
    return { code: 0, msg: 'success', data };
  }

  /** 更新候选人 */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: {
    name?: string;
    school?: string;
    major?: string;
    background?: string;
    personality?: string;
    real_level?: string;
    summary?: string;
    tag?: string;
    color?: string;
  }) {
    const data = await this.hrCandidateService.update('default_user_openid', id, body);
    return { code: 0, msg: 'success', data };
  }

  /** 删除候选人 */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const data = await this.hrCandidateService.delete('default_user_openid', id);
    return { code: 0, msg: 'success', data };
  }
}
