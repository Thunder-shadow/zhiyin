import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class HrCandidateService {
  private client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  /** 获取候选人列表 */
  async list(openid: string) {
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) return [];

    const { data, error } = await this.client
      .from('hr_candidates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List HR candidates error:', error);
      return [];
    }

    return data || [];
  }

  /** 获取单个候选人 */
  async detail(openid: string, id: string) {
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) return null;

    const { data, error } = await this.client
      .from('hr_candidates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Get HR candidate detail error:', error);
      return null;
    }

    return data;
  }

  /** 创建候选人 */
  async create(openid: string, body: {
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
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) throw new Error('User not found');

    const { data, error } = await this.client
      .from('hr_candidates')
      .insert({
        user_id: user.id,
        name: body.name,
        school: body.school,
        major: body.major,
        background: body.background || '',
        personality: body.personality || '',
        real_level: body.real_level || 'B',
        summary: body.summary || '',
        tag: body.tag || '',
        color: body.color || '#8B5CF6',
      })
      .select()
      .single();

    if (error) {
      console.error('Create HR candidate error:', error);
      throw error;
    }

    return data;
  }

  /** 更新候选人 */
  async update(openid: string, id: string, body: {
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
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) throw new Error('User not found');

    const { data, error } = await this.client
      .from('hr_candidates')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update HR candidate error:', error);
      throw error;
    }

    return data;
  }

  /** 删除候选人 */
  async delete(openid: string, id: string) {
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) throw new Error('User not found');

    const { error } = await this.client
      .from('hr_candidates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete HR candidate error:', error);
      throw error;
    }

    return { success: true };
  }
}
