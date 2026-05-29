import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class DashboardService {
  private client: SupabaseClient;

  constructor() {
    this.client = getSupabaseClient();
  }

  async getDashboard(openid: string) {
    // 获取用户信息
    const { data: user } = await this.client
      .from('users')
      .select('nick_name, level, exp, title')
      .eq('openid', openid)
      .single();

    if (!user) {
      return {
        user: { nick_name: '冒险者', level: 1, exp: 0, title: '求职新手' },
        stats: { applied: 0, interviewing: 0, offered: 0 },
      };
    }

    // 获取用户ID
    const { data: userData } = await this.client
      .from('users')
      .select('id')
      .eq('openid', openid)
      .single();

    // 统计各状态的岗位数量
    const stats = { applied: 0, interviewing: 0, offered: 0 };
    if (userData) {
      const { data: jobCards } = await this.client
        .from('job_cards')
        .select('status')
        .eq('user_id', userData.id);

      if (jobCards) {
        stats.applied = jobCards.filter(j => j.status === 'applied').length;
        stats.interviewing = jobCards.filter(j => j.status === 'interviewing').length;
        stats.offered = jobCards.filter(j => j.status === 'offered').length;
      }
    }

    return { user, stats };
  }
}
