import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InterviewService } from './interview.service';

@Controller('interviews')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Get()
  async list() {
    const data = await this.interviewService.list('default_user_openid');
    return { code: 0, msg: 'success', data };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const data = await this.interviewService.detail(id);
    return { code: 0, msg: 'success', data };
  }

  @Post()
  async create(@Body() body: { job_card_id?: string; type?: string }) {
    const data = await this.interviewService.create('default_user_openid', body);
    return { code: 0, msg: 'success', data };
  }

  @Post(':id/conversation')
  async addConversation(@Param('id') id: string, @Body() body: { conversation: any[] }) {
    const data = await this.interviewService.updateConversation(id, body.conversation);
    return { code: 0, msg: 'success', data };
  }

  @Post(':id/report')
  async generateReport(@Param('id') id: string) {
    const data = await this.interviewService.generateReport(id);
    return { code: 0, msg: 'success', data };
  }
}
