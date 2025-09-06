import { FluiContext } from '../types/advanced';
export declare class FileGenerator {
    private openai;
    constructor();
    generateFolderName(context: FluiContext): Promise<string>;
    generateFileName(content: string, extension: string, context: FluiContext): Promise<string>;
    private sanitizeFolderName;
    private sanitizeFileName;
    createProjectStructure(context: FluiContext): Promise<string>;
    private generateReadmeContent;
    saveContentToFile(content: string, extension: string, context: FluiContext, subdirectory?: string): Promise<string>;
    saveMultipleFiles(files: Array<{
        content: string;
        extension: string;
        subdirectory?: string;
    }>, context: FluiContext): Promise<string[]>;
    createProjectSummary(context: FluiContext): Promise<string>;
}
//# sourceMappingURL=fileGenerator.d.ts.map