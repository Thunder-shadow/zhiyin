import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

@Injectable()
export class InterviewService {
  private client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  async list(openid: string) {
    const { data: user } = await this.client.from('users').select('id').eq('openid', openid).single();
    if (!user) return [];

    const { data, error } = await this.client
      .from('interviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { console.error('List interviews error:', error); return []; }
    return data;
  }

  async detail(id: string) {
    const { data, error } = await this.client.from('interviews').select('*').eq('id', id).single();
    if (error) { console.error('Get interview error:', error); return null; }
    return data;
  }

  async create(openid: string, body: { job_card_id?: string; type?: string }) {
    const { data: user } = await this.client.from('users').select('id').eq('openid', openid).single();
    if (!user) throw new Error('User not found');

    const { data, error } = await this.client
      .from('interviews')
      .insert({ user_id: user.id, job_card_id: body.job_card_id || null, type: body.type || 'single', conversation: [] })
      .select()
      .single();

    if (error) { console.error('Create interview error:', error); throw error; }
    return data;
  }

  async updateConversation(id: string, conversation: any[]) {
    const { data, error } = await this.client
      .from('interviews')
      .update({ conversation, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) { console.error('Update conversation error:', error); throw error; }
    return data;
  }

  async generateReport(id: string) {
    const { data: interview } = await this.client.from('interviews').select('*').eq('id', id).single();
    if (!interview) throw new Error('Interview not found');

    const convText = JSON.stringify(interview.conversation || []);

    try {
      const config = new Config();
      const llmClient = new LLMClient(config);

      const messages = [
        {
          role: 'system' as const,
          content: `你是一个专业的面试评估专家。请根据面试对话内容，生成一份评估报告。
要求返回严格的JSON格式：
{
  "radar_logic": 数字1-100,
  "radar_stress": 数字1-100,
  "radar_expression": 数字1-100,
  "radar_trust": 数字1-100,
  "radar_profession": 数字1-100,
  "overall_comment": "总体评价",
  "highlights": "亮点",
  "improvements": "改进建议"
}`
        },
        { role: 'user' as const, content: `面试对话内容：${convText}` }
      ];

      const response = await llmClient.invoke(messages, { temperature: 0.3 });

      let reportData;
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        reportData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      } catch {
        reportData = {
          overall_comment: response.content,
          radar_logic: 60, radar_stress: 60, radar_expression: 60,
          radar_trust: 60, radar_profession: 60,
          highlights: '', improvements: ''
        };
      }

      const { data, error } = await this.client
        .from('interviews')
        .update({
          ...reportData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) { console.error('Save report error:', error); throw error; }
      return data;
    } catch (err) {
      console.error('Generate report LLM error:', err);
      // 返回默认报告
      return {
        ...interview,
        radar_logic: 50, radar_stress: 50, radar_expression: 50,
        radar_trust: 50, radar_profession: 50,
        overall_comment: '报告生成暂时不可用，请稍后再试',
        highlights: '', improvements: ''
      };
    }
  }
}
