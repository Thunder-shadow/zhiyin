import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: { action: string; [key: string]: any }, @Headers() headers: Record<string, string>) {
    console.log('AI chat request:', body.action, JSON.stringify(body).substring(0, 200));
    const result = await this.aiService.handleChat(body, headers);
    return { code: 0, msg: 'success', data: result };
  }
}
