import { Tool } from '../types/advanced';
import { PluginLoader } from '../core/pluginLoader';
export declare class AdvancedTools {
    private workingDirectory;
    private pluginTools;
    private pluginLoader;
    constructor(workingDirectory: string, pluginLoader?: PluginLoader);
    setWorkingDirectory(workingDirectory: string): void;
    createWebSearchTool(): Tool;
    createFetchTool(): Tool;
    createFileReadTool(): Tool;
    createFileWriteTool(): Tool;
    createDirectoryTool(): Tool;
    createBuildTool(): Tool;
    createStartTool(): Tool;
    createTestTool(): Tool;
    createShellTool(): Tool;
    createTextSplitTool(): Tool;
    createTextSummarizeTool(): Tool;
    getAllTools(): Tool[];
    getAllToolSchemas(): any[];
    refreshPluginTools(): void;
    private getWebSearchSchema;
    private getFetchSchema;
    private getFileReadSchema;
    private getFileWriteSchema;
    private getShellSchema;
    private getTextSplitSchema;
    private getTextSummarizeSchema;
}
//# sourceMappingURL=advancedTools.d.ts.map