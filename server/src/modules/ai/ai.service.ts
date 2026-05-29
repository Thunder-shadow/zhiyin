import { Injectable } from '@nestjs/common';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  data?: any;
  message?: string;
}

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
      case 'interview_start':
      case 'interview_follow_up':
      case 'interview_report':
        return this.handleInterviewChat(body, headers);
      case 'hr_sim':
      case 'hr_sim_response':
        return this.handleHrSim(body, headers);
      default:
        return { message: '未知操作类型' };
    }
  }

  /** 流式聊天接口 */
  async *handleChatStream(body: { action: string; [key: string]: any }, headers: Record<string, string>): AsyncGenerator<StreamChunk> {
    const { action } = body;

    switch (action) {
      case 'career_plan':
        yield* this.handleCareerPlanStream(body, headers);
        break;
      case 'interview_chat':
      case 'interview_start':
      case 'interview_follow_up':
        yield* this.handleInterviewChatStream(body, headers);
        break;
      case 'hr_sim':
      case 'hr_sim_response':
        yield* this.handleHrSimStream(body, headers);
        break;
      case 'interview_dungeon':
        yield* this.handleDungeonInterviewStream(body, headers);
        break;
      case 'interview_report':
        // 面试报告使用非流式
        try {
          const result = await this.handleInterviewChat(body, headers);
          yield { type: 'content', content: result.message || '' };
          yield { type: 'done', data: result };
        } catch (err) {
          yield { type: 'error', message: '生成报告失败' };
        }
        break;
      case 'resume_match':
      case 'strategy':
        // 需要结构化输出的场景使用非流式
        try {
          const result = await this.handleChat(body, headers);
          yield { type: 'content', content: JSON.stringify(result) };
          yield { type: 'done', data: result };
        } catch (err) {
          yield { type: 'error', message: '处理失败' };
        }
        break;
      default:
        yield { type: 'error', message: '未知操作类型' };
    }
  }

  /** 职业规划沙盘 - 流式 */
  private async *handleCareerPlanStream(body: { conversation?: any[]; [key: string]: any }, headers: Record<string, string>): AsyncGenerator<StreamChunk> {
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
      const stream = client.stream(messages, { temperature: 0.7 });
      let fullContent = '';
      for await (const chunk of stream) {
        if (chunk.content) {
          const text = chunk.content.toString();
          fullContent += text;
          yield { type: 'content', content: text };
        }
      }

      // 提取结构化数据
      const profileMatch = fullContent.match(/\[PROFILE\]\s*([\s\S]*?)\s*\[\/PROFILE\]/);
      const pathsMatch = fullContent.match(/\[PATHS\]\s*([\s\S]*?)\s*\[\/PATHS\]/);
      let profile = null;
      let paths = null;
      if (profileMatch) { try { profile = JSON.parse(profileMatch[1]); } catch { /* ignore */ } }
      if (pathsMatch) { try { paths = JSON.parse(pathsMatch[1]); } catch { /* ignore */ } }

      // 清理文本中的结构化标记
      const message = fullContent
        .replace(/\[PROFILE\][\s\S]*?\[\/PROFILE\]/, '')
        .replace(/\[PATHS\][\s\S]*?\[\/PATHS\]/, '')
        .trim();

      yield { type: 'done', data: { message, profile, paths } };
    } catch (err) {
      console.error('Career plan stream error:', err);
      yield { type: 'error', message: '导航师思考中，请稍后再试...' };
    }
  }

  /** 面试对话 - 流式 */
  private async *handleInterviewChatStream(body: { conversation?: any[]; type?: string; [key: string]: any }, headers: Record<string, string>): AsyncGenerator<StreamChunk> {
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    const interviewType = body.type || 'single';
    const typePrompt = interviewType === 'stress'
      ? '你正在进行压力面试，语气比平时更严厉，连续追问不给喘息空间，考验求职者的抗压能力。'
      : interviewType === 'group'
        ? '你在模拟群面场景，提醒求职者注意团队协作和发言时机。'
        : '';

    const conversation = body.conversation || [];
    const isFirst = conversation.length === 0;

    const systemPrompt = `你是一个专业的面试官，正在面试一位求职者。
${typePrompt}
规则：
- 每次只提一个问题或给出一个反馈
- 根据回答追问细节
- 偶尔施加压力测试
- 保持专业但友善的态度
- 用中文回复
${isFirst ? '这是面试开始，请先做简短的自我介绍引入，然后请求职者做自我介绍。' : ''}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
    ];

    try {
      const stream = client.stream(messages, { temperature: 0.7 });
      let fullContent = '';
      for await (const chunk of stream) {
        if (chunk.content) {
          const text = chunk.content.toString();
          fullContent += text;
          yield { type: 'content', content: text };
        }
      }
      yield { type: 'done', data: { message: fullContent } };
    } catch (err) {
      console.error('Interview stream error:', err);
      yield { type: 'error', message: '面试官思考中，请稍后再试...' };
    }
  }

  /** HR反向模拟 - 流式 */
  private async *handleHrSimStream(body: { conversation?: any[]; resume_index?: number; end?: boolean; candidate?: any; prompt?: string; [key: string]: any }, headers: Record<string, string>): AsyncGenerator<StreamChunk> {
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    // 使用用户创建的候选人数据
    const selectedResume = body.candidate
      ? {
          name: body.candidate.name || '候选人',
          school: `${body.candidate.school || ''}${body.candidate.major ? '·' + body.candidate.major : ''}`,
          background: body.candidate.background || '',
          personality: body.candidate.personality || '',
          real_level: body.candidate.real_level || 'B',
        }
      : { name: '候选人', school: '', background: '', personality: '', real_level: 'B' };

    // 结束模拟 - 生成HR笔记（非流式更好）
    if (body.end) {
      try {
        const result = await this.handleHrSim(body, headers);
        yield { type: 'content', content: result.reply || '' };
        yield { type: 'done', data: result };
      } catch (err) {
        yield { type: 'error', message: '招聘笔记生成失败' };
      }
      return;
    }

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
- 每次回复控制在250字以内，自然结束，不要截断
${isFirstMessage ? '这是面试开始，请做简短的自我介绍。' : ''}`;

    // 支持 prompt 参数（用于开场白）
    if (body.prompt) {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: body.prompt }
      ];

      try {
        const stream = client.stream(messages, { temperature: 0.8 });
        let fullContent = '';
        for await (const chunk of stream) {
          if (chunk.content) {
            const text = chunk.content.toString();
            fullContent += text;
            yield { type: 'content', content: text };
          }
        }
        yield { type: 'done', data: { reply: fullContent } };
      } catch (err) {
        console.error('HR sim prompt stream error:', err);
        yield { type: 'error', message: '候选人思考中...' };
      }
      return;
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
    ];

    try {
      const stream = client.stream(messages, { temperature: 0.8 });
      let fullContent = '';
      for await (const chunk of stream) {
        if (chunk.content) {
          const text = chunk.content.toString();
          fullContent += text;
          yield { type: 'content', content: text };
        }
      }
      yield { type: 'done', data: { reply: fullContent } };
    } catch (err) {
      console.error('HR sim stream error:', err);
      yield { type: 'error', message: '候选人思考中...' };
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
  private async handleInterviewChat(body: { conversation?: any[]; type?: string; [key: string]: any }, headers: Record<string, string>) {
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    const interviewType = body.type || 'single';
    const typePrompt = interviewType === 'stress'
      ? '你正在进行压力面试，语气比平时更严厉，连续追问不给喘息空间，考验求职者的抗压能力。'
      : interviewType === 'group'
        ? '你在模拟群面场景，提醒求职者注意团队协作和发言时机。'
        : '';

    const conversation = body.conversation || [];
    const isFirst = conversation.length === 0;

    const systemPrompt = `你是一个严格的面试官，正在面试一位求职者。
${typePrompt}
规则：
- 每次只提一个问题或给出一个反馈
- 根据回答追问细节
- 偶尔施加压力测试
- 保持专业但友善的态度
- 用中文回复
${isFirst ? '这是面试开始，请先做简短开场，然后请求职者做自我介绍。' : ''}`;

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
  private async handleHrSim(body: { conversation?: any[]; resume_index?: number; end?: boolean; candidate?: any; prompt?: string; [key: string]: any }, headers: Record<string, string>) {
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    // 使用用户创建的候选人数据
    const selectedResume = body.candidate
      ? {
          name: body.candidate.name || '候选人',
          school: `${body.candidate.school || ''}${body.candidate.major ? '·' + body.candidate.major : ''}`,
          background: body.candidate.background || '',
          personality: body.candidate.personality || '',
          real_level: body.candidate.real_level || 'B',
        }
      : { name: '候选人', school: '', background: '', personality: '', real_level: 'B' };

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
        return { reply: response.content };
      } catch (err) {
        console.error('HR sim end error:', err);
        return { reply: '招聘笔记生成失败，请稍后再试。' };
      }
    }

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
- 每次回复控制在250字以内，自然结束，不要截断
${isFirstMessage ? '这是面试开始，请做简短的自我介绍。' : ''}`;

    // 支持 prompt 参数（用于开场白）
    if (body.prompt) {
      console.log('HR sim - handling prompt:', body.prompt.substring(0, 100));
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: body.prompt }
      ];

      try {
        console.log('HR sim - calling LLM...');
        const response = await client.invoke(messages, { temperature: 0.8 });
        console.log('HR sim - LLM response:', response?.content?.substring(0, 100) || '(empty)');
        return { reply: response.content };
      } catch (err) {
        console.error('HR sim prompt LLM error:', err);
        return { reply: '候选人思考中...' };
      }
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
    ];

    try {
      const response = await client.invoke(messages, { temperature: 0.8 });
      return { reply: response.content };
    } catch (err) {
      console.error('HR sim chat LLM error:', err);
      return { reply: '候选人思考中...' };
    }
  }

  /** 副本面试 - 流式 */
  private async *handleDungeonInterviewStream(body: {
    company?: string;
    position?: string;
    description?: string;
    round?: number;
    max_rounds?: number;
    force_decision?: boolean;
    conversation?: any[];
    [key: string]: any;
  }, headers: Record<string, string>): AsyncGenerator<StreamChunk> {
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(headers);
    const client = new LLMClient(config, customHeaders);

    const company = body.company || '该公司';
    const position = body.position || '岗位';
    const description = body.description || '';
    const round = body.round || 0;
    const maxRounds = body.max_rounds || 30;
    const forceDecision = body.force_decision || false;
    const conversation = body.conversation || [];

    const systemPrompt = `你是${company}的${position}面试官。

## 面试规则
1. 你是专业的面试官，正在面试一位求职者
2. 面试最多进行${maxRounds}轮对话
3. 你需要在${maxRounds}轮内评估求职者是否适合这个岗位
4. 评估维度：专业能力、沟通表达、逻辑思维、岗位匹配度
${description ? `5. 岗位要求：${description}` : ''}

## 面试流程
- 第1-5轮：自我介绍、基本情况了解
- 第6-15轮：专业能力考察（技术问题、项目经验）
- 第16-25轮：综合能力考察（情景题、压力题）
- 第26-${maxRounds}轮：收尾阶段，做出最终判断

## 判断标准
- 如果求职者表现优秀，在任何一轮都可以提前给出Offer
- 如果求职者表现明显不符合，可以在15轮后提前结束
- 必须在${maxRounds}轮内给出明确结果

## 输出格式
当你决定给出结果时，必须使用以下格式：
[OFFER_DECISION:PASS] 或 [OFFER_DECISION:FAIL]

并在后面附上评语和评分（1-10分）：
[EVALUATION]
专业能力：X/10
沟通表达：X/10
逻辑思维：X/10
岗位匹配：X/10
综合评分：X/10
[/EVALUATION]

## 注意事项
- 保持专业和友好
- 问题要有针对性，根据岗位调整
- 适时追问，深入了解求职者能力
- 不要问与岗位无关的问题${forceDecision ? `

**重要：面试已达到${maxRounds}轮上限，请在本轮回复中立即给出最终判断（[OFFER_DECISION:PASS]或[OFFER_DECISION:FAIL]）和评分。**` : ''}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
    ];

    try {
      const stream = client.stream(messages, { temperature: 0.7 });
      let fullContent = '';
      for await (const chunk of stream) {
        if (chunk.content) {
          const text = chunk.content.toString();
          fullContent += text;
          yield { type: 'content', content: text };
        }
      }
      yield { type: 'done', data: { message: fullContent } };
    } catch (err) {
      console.error('Dungeon interview stream error:', err);
      yield { type: 'error', message: '面试官思考中...' };
    }
  }
}
