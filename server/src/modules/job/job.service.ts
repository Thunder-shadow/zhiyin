import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class JobService {
  private client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  async list(openid: string) {
    const { data: user } = await this.client.from('users').select('id').eq('openid', openid).single();
    if (!user) return [];

    const { data, error } = await this.client
      .from('job_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { console.error('List jobs error:', error); return []; }
    return data;
  }

  async detail(id: string) {
    const { data, error } = await this.client.from('job_cards').select('*').eq('id', id).single();
    if (error) { console.error('Get job error:', error); return null; }
    return data;
  }

  async create(openid: string, body: { company: string; position: string; jd_text?: string; jd_url?: string; industry?: string; salary?: string; location?: string; education?: string }) {
    const { data: user } = await this.client.from('users').select('id').eq('openid', openid).single();
    if (!user) throw new Error('User not found');

    const { data, error } = await this.client
      .from('job_cards')
      .insert({ user_id: user.id, ...body })
      .select()
      .single();

    if (error) { console.error('Create job error:', error); throw error; }
    return data;
  }

  async update(id: string, body: Record<string, any>) {
    const { data, error } = await this.client
      .from('job_cards')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) { console.error('Update job error:', error); throw error; }
    return data;
  }

  async remove(id: string) {
    const { error } = await this.client.from('job_cards').delete().eq('id', id);
    if (error) { console.error('Delete job error:', error); throw error; }
  }
}
