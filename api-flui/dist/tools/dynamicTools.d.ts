import { Tool } from '../types/advanced';
export declare class DynamicTools {
    private workingDirectory;
    constructor(workingDirectory: string);
    createProjectTypeDetector(): Tool;
    createDependencyManager(): Tool;
    createBuildValidator(): Tool;
    createTestRunner(): Tool;
    createServerValidator(): Tool;
    createFileBackupManager(): Tool;
    createProjectAnalyzer(): Tool;
    private detectProjectType;
    private installDependencies;
    private validateBuild;
    private runTests;
    private validateServer;
    private backupFile;
    private restoreFile;
    private analyzeProject;
    private analyzeProjectStructure;
    createShellTool(): Tool;
    createPackageManagerTool(): Tool;
    createFileWriteTool(): Tool;
}
//# sourceMappingURL=dynamicTools.d.ts.map