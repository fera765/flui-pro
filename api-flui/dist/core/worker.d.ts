import { Task, TaskResult } from '../types';
import { PollinationsTool } from '../tools/pollinationsTool';
export declare class Worker {
    private pollinationsTool;
    private isWorking;
    private currentTaskId;
    constructor(pollinationsTool: PollinationsTool);
    executeTask(task: Task): Promise<TaskResult>;
    isAvailable(): boolean;
    getCurrentTaskId(): string | null;
    private handleConversation;
    private handleTask;
    private handleImageGeneration;
    private handleTextGeneration;
    private handleAudioTask;
    private handleCompositeTask;
    private isImagePrompt;
    private isTextPrompt;
}
//# sourceMappingURL=worker.d.ts.map