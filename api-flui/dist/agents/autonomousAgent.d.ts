import { Agent, AgentTask, AgentResponse, Tool } from '../types/advanced';
export declare class AutonomousAgent {
    private agent;
    private availableTools;
    private openai;
    private tools;
    constructor(agent: Agent, availableTools: Tool[]);
    executeTask(task: AgentTask): Promise<AgentResponse>;
    private createSystemPrompt;
    private prepareToolsForOpenAI;
    private handleToolCalls;
}
//# sourceMappingURL=autonomousAgent.d.ts.map