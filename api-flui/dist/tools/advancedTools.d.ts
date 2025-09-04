import { Tool } from '../types/advanced';
export declare class AdvancedTools {
    private workingDirectory;
    constructor(workingDirectory: string);
    createWebSearchTool(): Tool;
    createFetchTool(): Tool;
    createFileReadTool(): Tool;
    createFileWriteTool(): Tool;
    createShellTool(): Tool;
    createTextSplitTool(): Tool;
    createTextSummarizeTool(): Tool;
    getAllTools(): Tool[];
}
//# sourceMappingURL=advancedTools.d.ts.map