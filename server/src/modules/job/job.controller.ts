import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { JobService } from './job.service';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  async list() {
    const data = await this.jobService.list('default_user_openid');
    return { code: 0, msg: 'success', data };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const data = await this.jobService.detail(id);
    return { code: 0, msg: 'success', data };
  }

  @Post()
  async create(@Body() body: { company: string; position: string; jd_text?: string; jd_url?: string; industry?: string; salary?: string; location?: string; education?: string }) {
    const data = await this.jobService.create('default_user_openid', body);
    return { code: 0, msg: 'success', data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, any>) {
    const data = await this.jobService.update(id, body);
    return { code: 0, msg: 'success', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.jobService.remove(id);
    return { code: 0, msg: 'success', data: null };
  }
}
