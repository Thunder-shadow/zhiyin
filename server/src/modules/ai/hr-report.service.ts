import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class HrReportService {
  private client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  /** 获取历史报告列表 */
  async list(openid: string) {
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) return [];

    const { data, error } = await this.client
      .from('hr_simulations')
      .select('id, selected_resume_index, hr_notes, created_at, conversation')
      .eq('user_id', user.id)
      .eq('result_revealed', true)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    // 映射成前端需要的格式
    const resumeNames = ['张明', '李华', '王芳'];
    return (data || []).map((item: any) => ({
      id: item.id,
      resume_index: item.selected_resume_index,
      candidate_name: resumeNames[item.selected_resume_index || 0] || '候选人',
      report_content: item.hr_notes,
      conversation: item.conversation || [],
      created_at: item.created_at,
    }));
  }

  /** 创建/保存报告 */
  async save(openid: string, body: {
    resume_index: number;
    candidate_name: string;
    report_content: string;
    conversation?: any[];
  }) {
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) throw new Error('User not found');

    const { data, error } = await this.client
      .from('hr_simulations')
      .insert({
        user_id: user.id,
        selected_resume_index: body.resume_index,
        hr_notes: body.report_content,
        conversation: body.conversation || [],
        result_revealed: true,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /** 删除报告 */
  async delete(openid: string, id: string) {
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) throw new Error('User not found');

    const { error } = await this.client
      .from('hr_simulations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  /** 获取单个报告详情 */
  async detail(openid: string, id: string) {
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) return null;

    const { data, error } = await this.client
      .from('hr_simulations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return null;
    }

    const resumeNames = ['张明', '李华', '王芳'];
    return {
      id: data.id,
      resume_index: data.selected_resume_index,
      candidate_name: resumeNames[data.selected_resume_index || 0] || '候选人',
      report_content: data.hr_notes,
      conversation: data.conversation || [],
      created_at: data.created_at,
    };
  }
}
