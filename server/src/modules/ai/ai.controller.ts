import { Controller, Post, Body, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
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

  @Post('chat/stream')
  async chatStream(@Body() body: { action: string; [key: string]: any }, @Headers() headers: Record<string, string>, @Res() res: Response) {
    console.log('AI stream request:', body.action, JSON.stringify(body).substring(0, 200));

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream = this.aiService.handleChatStream(body, headers);
      for await (const chunk of stream) {
        if (chunk.type === 'content') {
          res.write(`data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`);
        } else if (chunk.type === 'done') {
          res.write(`data: ${JSON.stringify({ type: 'done', data: chunk.data })}\n\n`);
        } else if (chunk.type === 'error') {
          res.write(`data: ${JSON.stringify({ type: 'error', message: chunk.message })}\n\n`);
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', message: '流式响应异常' })}\n\n`);
    } finally {
      res.end();
    }
  }
}
