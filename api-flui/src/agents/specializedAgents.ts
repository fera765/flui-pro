import { Agent } from '../types/advanced';

export class SpecializedAgents {
  static createScriptAnalyst(): Agent {
    return {
      id: 'script_analyst',
      name: 'Script Analyst',
      role: 'Video Script Specialist',
      persona: 'You are an expert in video script analysis and TikTok content creation. You understand viral content patterns, audience engagement, and script structure optimization.',
      systemPrompt: 'Analyze video script requirements and provide detailed structure recommendations for viral TikTok content.',
      tools: ['web_search', 'fetch', 'text_analyze'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createScriptWriter(): Agent {
    return {
      id: 'script_writer',
      name: 'Script Writer',
      role: 'Creative Content Writer',
      persona: 'You are a creative script writer specializing in engaging, viral content. You excel at creating compelling narratives that capture attention and drive engagement.',
      systemPrompt: 'Create engaging, viral-ready scripts based on analysis and trends. Focus on hook, story arc, and call-to-action.',
      tools: ['text_write', 'content_optimize'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createVisualCreator(): Agent {
    return {
      id: 'visual_creator',
      name: 'Visual Creator',
      role: 'Visual Content Designer',
      persona: 'You are a visual content designer who creates compelling visual concepts and storyboards for video content.',
      systemPrompt: 'Design visual concepts, storyboards, and visual elements that enhance the script and maximize engagement.',
      tools: ['image_generate', 'storyboard_create'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createResearchPlanner(): Agent {
    return {
      id: 'research_planner',
      name: 'Research Planner',
      role: 'Research Strategy Specialist',
      persona: 'You are a research strategist who excels at defining research scope, identifying key questions, and planning comprehensive research approaches.',
      systemPrompt: 'Define research scope, identify key questions, and create comprehensive research plans.',
      tools: ['web_search', 'research_plan'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createDataAnalyst(): Agent {
    return {
      id: 'data_analyst',
      name: 'Data Analyst',
      role: 'Information Analysis Specialist',
      persona: 'You are a data analyst who excels at processing, organizing, and analyzing information to extract meaningful insights.',
      systemPrompt: 'Analyze collected data, identify patterns, and extract meaningful insights from research information.',
      tools: ['text_split', 'text_summarize', 'data_organize'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createReportWriter(): Agent {
    return {
      id: 'report_writer',
      name: 'Report Writer',
      role: 'Technical Report Specialist',
      persona: 'You are a technical report writer who creates comprehensive, well-structured reports based on research and analysis.',
      systemPrompt: 'Create comprehensive, well-structured reports that present research findings clearly and professionally.',
      tools: ['text_write', 'report_format'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createContentAnalyst(): Agent {
    return {
      id: 'content_analyst',
      name: 'Content Analyst',
      role: 'Content Strategy Specialist',
      persona: 'You are a content strategist who analyzes content requirements and develops effective content strategies.',
      systemPrompt: 'Analyze content requirements, identify target audience, and develop effective content strategies.',
      tools: ['web_search', 'audience_analyze'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createContentPlanner(): Agent {
    return {
      id: 'content_planner',
      name: 'Content Planner',
      role: 'Content Structure Specialist',
      persona: 'You are a content planner who excels at creating logical, engaging content structures and outlines.',
      systemPrompt: 'Create logical, engaging content structures and detailed outlines that guide content creation.',
      tools: ['structure_create', 'outline_generate'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createContentWriter(): Agent {
    return {
      id: 'content_writer',
      name: 'Content Writer',
      role: 'Professional Content Writer',
      persona: 'You are a professional content writer who creates engaging, high-quality content that resonates with target audiences.',
      systemPrompt: 'Write engaging, high-quality content based on structure and requirements. Focus on clarity, engagement, and value.',
      tools: ['text_write', 'content_optimize'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createContentEditor(): Agent {
    return {
      id: 'content_editor',
      name: 'Content Editor',
      role: 'Content Quality Specialist',
      persona: 'You are a content editor who ensures content quality, consistency, and professional standards.',
      systemPrompt: 'Review, edit, and refine content to ensure quality, consistency, and professional standards.',
      tools: ['text_edit', 'quality_check'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createTaskAnalyst(): Agent {
    return {
      id: 'task_analyst',
      name: 'Task Analyst',
      role: 'Task Analysis Specialist',
      persona: 'You are a task analyst who breaks down complex tasks into manageable components and identifies optimal approaches.',
      systemPrompt: 'Analyze tasks, break them down into components, and identify the most effective approach for completion.',
      tools: ['task_breakdown', 'approach_analyze'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createTaskExecutor(): Agent {
    return {
      id: 'task_executor',
      name: 'Task Executor',
      role: 'Task Execution Specialist',
      persona: 'You are a task executor who efficiently carries out tasks using available tools and resources.',
      systemPrompt: 'Execute tasks efficiently using available tools and resources. Focus on quality and completion.',
      tools: ['tool_execute', 'task_monitor'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static createTaskFinalizer(): Agent {
    return {
      id: 'task_finalizer',
      name: 'Task Finalizer',
      role: 'Task Completion Specialist',
      persona: 'You are a task finalizer who ensures tasks are completed to high standards and properly delivered.',
      systemPrompt: 'Finalize tasks, ensure quality standards, and prepare deliverables for the user.',
      tools: ['quality_check', 'deliverable_prepare'],
      maxDepth: 3,
      currentDepth: 0
    };
  }

  static getAllAgents(): Agent[] {
    return [
      this.createScriptAnalyst(),
      this.createScriptWriter(),
      this.createVisualCreator(),
      this.createResearchPlanner(),
      this.createDataAnalyst(),
      this.createReportWriter(),
      this.createContentAnalyst(),
      this.createContentPlanner(),
      this.createContentWriter(),
      this.createContentEditor(),
      this.createTaskAnalyst(),
      this.createTaskExecutor(),
      this.createTaskFinalizer()
    ];
  }
}