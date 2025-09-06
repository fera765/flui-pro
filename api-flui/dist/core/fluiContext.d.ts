import { FluiContext, TodoItem, AgentTask } from '../types/advanced';
export declare class FluiContextManager {
    private context;
    constructor(mainTask: string, workingDirectory: string);
    getContext(): FluiContext;
    updateGlobalContext(newContext: string): void;
    addCollectedData(key: string, data: any): void;
    getCollectedData(key: string): any;
    getAllCollectedData(): Record<string, any>;
    addTodo(todo: TodoItem): void;
    addTodos(todos: TodoItem[]): void;
    updateTodoStatus(todoId: string, status: TodoItem['status'], result?: any, error?: string): void;
    getNextExecutableTodos(): TodoItem[];
    isTaskComplete(): boolean;
    addGeneratedFile(filePath: string): void;
    getGeneratedFiles(): string[];
    saveContextToFile(): Promise<void>;
    loadContextFromFile(): Promise<void>;
    generateSummary(): string;
    createAgentTask(agentId: string, prompt: string, tools: string[]): AgentTask;
    updateCurrentAgent(agentId: string): void;
    getCurrentAgent(): string | undefined;
    getWorkingDirectory(): string;
    ensureWorkingDirectory(): Promise<void>;
}
//# sourceMappingURL=fluiContext.d.ts.map