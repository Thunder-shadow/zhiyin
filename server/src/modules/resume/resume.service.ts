import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class ResumeService {
  private client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  async list(openid: string) {
    const { data: user } = await this.client.from('users').select('id').eq('openid', openid).single();
    if (!user) return [];

    const { data, error } = await this.client
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { console.error('List resumes error:', error); return []; }
    return data;
  }

  async detail(id: string) {
    const { data, error } = await this.client.from('resumes').select('*').eq('id', id).single();
    if (error) { console.error('Get resume error:', error); return null; }
    return data;
  }

  async create(openid: string, body: { version_name: string; content_text: string }) {
    const { data: user } = await this.client.from('users').select('id').eq('openid', openid).single();
    if (!user) throw new Error('User not found');

    const { data, error } = await this.client
      .from('resumes')
      .insert({ user_id: user.id, version_name: body.version_name, content_text: body.content_text })
      .select()
      .single();

    if (error) { console.error('Create resume error:', error); throw error; }
    return data;
  }

  async update(id: string, body: Record<string, any>) {
    const { data, error } = await this.client
      .from('resumes')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) { console.error('Update resume error:', error); throw error; }
    return data;
  }

  async remove(id: string) {
    const { error } = await this.client.from('resumes').delete().eq('id', id);
    if (error) { console.error('Delete resume error:', error); throw error; }
  }
}
