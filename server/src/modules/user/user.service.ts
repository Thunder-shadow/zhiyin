import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class UserService {
  private client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  /** 获取或创建用户 */
  async getOrCreateProfile(openid: string) {
    // 先查
    const { data: existing } = await this.client
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single();

    if (existing) {
      // 计算下一级所需经验
      const nextLevel = existing.level + 1;
      const expToNext = nextLevel * nextLevel * 100;
      return {
        ...existing,
        exp_to_next: expToNext,
        total_battles: existing.total_battles || 0,
        wins: existing.wins || 0,
        interviews: existing.interviews || 0,
        resumes: existing.resumes || 0,
        streak: existing.streak || 0,
      };
    }

    // 不存在则创建
    const { data: created, error } = await this.client
      .from('users')
      .insert({ openid, nick_name: '冒险者', level: 1, exp: 0, title: '求职新手', badges: [] })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...created,
      exp_to_next: 100,
      total_battles: 0,
      wins: 0,
      interviews: 0,
      resumes: 0,
      streak: 0,
    };
  }

  /** 更新用户信息 */
  async updateProfile(openid: string, updates: Record<string, any>) {
    const { data: user } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    if (!user) return null;

    const { data, error } = await this.client
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /** 增加经验值 */
  async addExp(openid: string, expGain: number) {
    const { data: user } = await this.client
      .from('users')
      .select('id, level, exp')
      .eq('openid', openid)
      .single();

    if (!user) return null;

    let newExp = user.exp + expGain;
    let newLevel = user.level;
    let newTitle = '求职新手';

    // 简单升级逻辑
    while (newExp >= newLevel * newLevel * 100) {
      newExp -= newLevel * newLevel * 100;
      newLevel++;
    }

    // 称号映射
    const titles: Record<number, string> = {
      1: '求职新手', 5: '简历游侠', 10: '面试勇者', 20: 'Offer收割者'
    };
    for (const [lv, t] of Object.entries(titles).sort((a, b) => Number(b[0]) - Number(a[0]))) {
      if (newLevel >= Number(lv)) { newTitle = t; break; }
    }

    const { data, error } = await this.client
      .from('users')
      .update({ level: newLevel, exp: newExp, title: newTitle, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
