import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard() {
    const data = await this.dashboardService.getDashboard('default_user_openid');
    return { code: 0, msg: 'success', data };
  }
}
