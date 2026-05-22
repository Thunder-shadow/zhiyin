import { Injectable } from '@nestjs/common';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

@Injectable()
export class AiService {
  async handleChat(body: { action: string; [key: string]: any }, headers: Record<string, string>) {
    const { action } = body;

    switch (action) {
      case 'career_plan':
        return this.handleCareerPlan(body, headers);
      case 'resume_match':
        return this.handleResumeMatch(body, headers);
      case 'strategy':
        return this.handleStrategy(body, headers);
      case 'interview_chat':
        return this.handleInterviewChat(body, headers);
      case 'hr_sim_response':
        return this.handleHrSim(body, headers);
      default:
        return { message: '未知操作类型' };
    }
  }

  /** 职业规划沙盘 */
  private async handleCareerPlan(body: { conversation?: any[]; [key: string]: any }, headers: Record<string, string>) {
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    const conversation = body.conversation || [];
    const systemPrompt = `你是"职引"App的职业导航师，帮助大学生规划职业路径。
你的风格：像一个RPG游戏的向导NPC，用游戏化的语言鼓励用户。

对话策略：
1. 前几轮：了解用户的专业、兴趣、性格特点、目标行业
2. 中间轮：基于信息给出职业画像和路径推荐
3. 当信息足够时，返回结构化数据

当信息足够丰富时（通常3-5轮对话后），在回复的最后附带JSON数据块：
[PROFILE]
{"strengths":["优势1","优势2"],"interests":["兴趣1","兴趣2"]}
[/PROFILE]
[PATHS]
[{"name":"路径名","fit_score":85,"description":"描述","milestones":["里程碑1","里程碑2"]}]
[/PATHS]

注意：fit_score是匹配度百分比(0-100)。路径数量2-3条。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
    ];

    try {
      const response = await client.invoke(messages, { temperature: 0.7 });
      const content = response.content;

      // 尝试提取结构化数据
      const profileMatch = content.match(/\[PROFILE\]\s*([\s\S]*?)\s*\[\/PROFILE\]/);
      const pathsMatch = content.match(/\[PATHS\]\s*([\s\S]*?)\s*\[\/PATHS\]/);

      let profile = null;
      let paths = null;

      if (profileMatch) {
        try { profile = JSON.parse(profileMatch[1]); } catch { /* ignore */ }
      }
      if (pathsMatch) {
        try { paths = JSON.parse(pathsMatch[1]); } catch { /* ignore */ }
      }

      // 移除结构化标记后返回文本
      const message = content
        .replace(/\[PROFILE\][\s\S]*?\[\/PROFILE\]/, '')
        .replace(/\[PATHS\][\s\S]*?\[\/PATHS\]/, '')
        .trim();

      return { message, profile, paths };
    } catch (err) {
      console.error('Career plan LLM error:', err);
      return { message: '导航师思考中，请稍后再试...' };
    }
  }

  /** 简历-JD匹配分析 */
  private async handleResumeMatch(body: { resume_text?: string; jd_text?: string; [key: string]: any }, headers: Record<string, string>) {
    const { resume_text, jd_text } = body;
    if (!resume_text || !jd_text) {
      return { match_score: 0, suggestions: '请提供简历和JD内容' };
    }

    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    const messages = [
      {
        role: 'system' as const,
        content: `你是简历匹配分析师。对比简历和JD，返回严格的JSON：
{"match_score":数字0-100,"suggestions":"改进建议，包括缺失的关键技能和优化方向"}`
      },
      { role: 'user' as const, content: `简历：${resume_text}\n\nJD：${jd_text}` }
    ];

    try {
      const response = await client.invoke(messages, { temperature: 0.3 });
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { match_score: 50, suggestions: response.content };
    } catch (err) {
      console.error('Resume match LLM error:', err);
      return { match_score: 0, suggestions: '分析暂时不可用' };
    }
  }

  /** 岗位策略生成 */
  private async handleStrategy(body: { jd_text?: string; [key: string]: any }, headers: Record<string, string>) {
    const { jd_text } = body;
    if (!jd_text) return { resume_tips: '', hidden_requirements: '', hr_questions_prediction: [], actions: [] };

    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    const messages = [
      {
        role: 'system' as const,
        content: `你是求职策略师。根据JD生成攻略，返回严格的JSON：
{
  "resume_tips": "简历修改建议",
  "hidden_requirements": "隐藏要求分析",
  "hr_questions_prediction": ["预测面试题1","预测面试题2","预测面试题3"],
  "actions": ["行动建议1","行动建议2","行动建议3"]
}`
      },
      { role: 'user' as const, content: `JD内容：${jd_text}` }
    ];

    try {
      const response = await client.invoke(messages, { temperature: 0.5 });
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { resume_tips: response.content, hidden_requirements: '', hr_questions_prediction: [], actions: [] };
    } catch (err) {
      console.error('Strategy LLM error:', err);
      return { resume_tips: '', hidden_requirements: '', hr_questions_prediction: [], actions: [] };
    }
  }

  /** 面试对话 */
  private async handleInterviewChat(body: { conversation?: any[]; job_card_id?: string; [key: string]: any }, headers: Record<string, string>) {
    const conversation = body.conversation || [];
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是一个严格的面试官，正在面试一位求职者。
规则：
- 每次只提一个问题或给出一个反馈
- 根据回答追问细节
- 偶尔施加压力测试
- 保持专业但友善的态度
- 用中文回复`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
    ];

    try {
      const response = await client.invoke(messages, { temperature: 0.7 });
      return { message: response.content };
    } catch (err) {
      console.error('Interview chat LLM error:', err);
      return { message: '面试官思考中，请稍后再试...' };
    }
  }

  /** HR反向模拟 */
  private async handleHrSim(body: { conversation?: any[]; resume_index?: number; end?: boolean; [key: string]: any }, headers: Record<string, string>) {
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    const resumeProfiles = [
      { name: '张明', school: '北京大学·计算机', background: '3段大厂实习，GPA 3.8，算法竞赛省一', personality: '技术宅，不善社交但专业扎实', real_level: 'A' },
      { name: '李华', school: '中山大学·市场营销', background: '1段创业经历，学生会主席，社会实践丰富', personality: '外向能说，但技术基础弱', real_level: 'B' },
      { name: '王芳', school: '复旦·金融学', background: '2段投行实习，英语专八，CPA在考', personality: '沉稳干练，偶尔过于保守', real_level: 'A' },
    ];

    const selectedResume = resumeProfiles[body.resume_index || 0];

    // 结束模拟 - 生成HR笔记
    if (body.end) {
      const conversation = body.conversation || [];
      const messages = [
        {
          role: 'system' as const,
          content: `你是HR反向模拟的裁判。用户扮演HR面试了候选人"${selectedResume.name}"（${selectedResume.school}）。
根据面试对话，生成HR招聘笔记，揭示候选人的真实水平。
候选人真实评级：${selectedResume.real_level}级（A=优秀, B=良好）
返回纯文本格式的招聘笔记。`
        },
        { role: 'user' as const, content: `面试对话记录：${JSON.stringify(conversation)}` }
      ];

      try {
        const response = await client.invoke(messages, { temperature: 0.7 });
        return { hr_notes: response.content };
      } catch (err) {
        console.error('HR sim end error:', err);
        return { hr_notes: '招聘笔记生成失败，请稍后再试。' };
      }
    }

    // 正常对话 - 扮演候选人
    const conversation = body.conversation || [];
    const isFirstMessage = conversation.length === 0;

    const systemPrompt = `你在HR反向模拟中扮演候选人"${selectedResume.name}"。
背景：${selectedResume.school}，${selectedResume.background}
性格：${selectedResume.personality}
真实水平：${selectedResume.real_level}级

规则：
- 完全沉浸角色，不要出戏
- 回答要符合你的背景和性格
- 偶尔露出与真实水平相符的表现
- 如果HR问得尖锐，按你的性格做出反应
- 用中文回复
${isFirstMessage ? '这是面试开始，请做简短的自我介绍。' : ''}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
    ];

    try {
      const response = await client.invoke(messages, { temperature: 0.8 });
      return { message: response.content };
    } catch (err) {
      console.error('HR sim chat LLM error:', err);
      return { message: '候选人思考中...' };
    }
  }
}
