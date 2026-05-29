import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { HrReportService } from './hr-report.service';

@Controller('hr-reports')
export class HrReportController {
  constructor(private readonly hrReportService: HrReportService) {}

  /** 获取历史报告列表 */
  @Get()
  async list() {
    const data = await this.hrReportService.list('default_user_openid');
    return { code: 0, msg: 'success', data };
  }

  /** 获取单个报告详情 */
  @Get(':id')
  async detail(@Param('id') id: string) {
    const data = await this.hrReportService.detail('default_user_openid', id);
    if (!data) return { code: 404, msg: '报告不存在', data: null };
    return { code: 0, msg: 'success', data };
  }

  /** 保存报告 */
  @Post()
  async save(@Body() body: { resume_index: number; candidate_name: string; report_content: string; conversation?: any[] }) {
    const data = await this.hrReportService.save('default_user_openid', body);
    return { code: 0, msg: 'success', data };
  }

  /** 删除报告 */
  @Delete(':id')
  async delete(@Param('id') id: string) {
    const data = await this.hrReportService.delete('default_user_openid', id);
    return { code: 0, msg: 'success', data };
  }
}
