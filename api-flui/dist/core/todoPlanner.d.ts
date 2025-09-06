import { TodoItem } from '../types/advanced';
export declare class TodoPlanner {
    analyzeTaskComplexity(prompt: string): Promise<TodoItem[]>;
    private assessComplexity;
    private createVideoCreationTodos;
    private createResearchTodos;
    private createContentCreationTodos;
    private createTechTodos;
    private createGenericTodos;
    updateTodoStatus(todoId: string, status: TodoItem['status'], result?: any, error?: string): void;
    getNextExecutableTodos(todos: TodoItem[]): TodoItem[];
    isTaskComplete(todos: TodoItem[]): boolean;
}
//# sourceMappingURL=todoPlanner.d.ts.map