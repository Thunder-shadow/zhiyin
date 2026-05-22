import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ResumeService } from './resume.service';

@Controller('resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get()
  async list() {
    const data = await this.resumeService.list('default_user_openid');
    return { code: 0, msg: 'success', data };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const data = await this.resumeService.detail(id);
    return { code: 0, msg: 'success', data };
  }

  @Post()
  async create(@Body() body: { version_name: string; content_text: string }) {
    const data = await this.resumeService.create('default_user_openid', body);
    return { code: 0, msg: 'success', data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { version_name?: string; content_text?: string }) {
    const data = await this.resumeService.update(id, body);
    return { code: 0, msg: 'success', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.resumeService.remove(id);
    return { code: 0, msg: 'success', data: null };
  }
}
