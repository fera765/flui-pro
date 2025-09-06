"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileGenerator = void 0;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class FileGenerator {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY || '',
            baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:4000',
            dangerouslyAllowBrowser: true
        });
    }
    async generateFolderName(context) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'openai',
                messages: [
                    {
                        role: 'system',
                        content: `Generate a descriptive, professional folder name for a project based on the main task. 
            The name should be:
            - Descriptive and clear
            - Use kebab-case (lowercase with hyphens)
            - Maximum 50 characters
            - No special characters except hyphens
            - Professional and project-appropriate
            
            Main task: ${context.mainTask}
            Context: ${context.globalContext}`
                    },
                    {
                        role: 'user',
                        content: 'Generate a folder name for this project'
                    }
                ],
                temperature: 0.7,
                max_tokens: 50
            });
            const folderName = response.choices[0]?.message?.content?.trim() || 'flui-project';
            return this.sanitizeFolderName(folderName);
        }
        catch (error) {
            return 'flui-project';
        }
    }
    async generateFileName(content, extension, context) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'openai',
                messages: [
                    {
                        role: 'system',
                        content: `Generate a descriptive, professional file name for content. 
            The name should be:
            - Descriptive and clear
            - Use kebab-case (lowercase with hyphens)
            - Maximum 40 characters
            - No special characters except hyphens
            - Professional and content-appropriate
            - Include the appropriate extension: .${extension}
            
            Content preview: ${content.substring(0, 200)}...
            Project context: ${context.mainTask}`
                    },
                    {
                        role: 'user',
                        content: `Generate a file name for this ${extension} content`
                    }
                ],
                temperature: 0.7,
                max_tokens: 50
            });
            const fileName = response.choices[0]?.message?.content?.trim() || `generated-file.${extension}`;
            return this.sanitizeFileName(fileName, extension);
        }
        catch (error) {
            return `generated-file.${extension}`;
        }
    }
    sanitizeFolderName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }
    sanitizeFileName(name, extension) {
        const baseName = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 40);
        const finalName = baseName.endsWith(`.${extension}`) ? baseName : `${baseName}.${extension}`;
        return finalName;
    }
    async createProjectStructure(context) {
        const folderName = await this.generateFolderName(context);
        const projectPath = path.join(context.workingDirectory, folderName);
        try {
            await fs.mkdir(projectPath, { recursive: true });
            await fs.mkdir(path.join(projectPath, 'assets'), { recursive: true });
            await fs.mkdir(path.join(projectPath, 'docs'), { recursive: true });
            await fs.mkdir(path.join(projectPath, 'output'), { recursive: true });
            const readmeContent = this.generateReadmeContent(context);
            await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent, 'utf-8');
            context.workingDirectory = projectPath;
            context.generatedFiles.push('README.md');
            return projectPath;
        }
        catch (error) {
            throw new Error(`Failed to create project structure: ${error}`);
        }
    }
    generateReadmeContent(context) {
        return `# ${context.mainTask}

## Project Overview
This project was generated by Flui AI Orchestrator.

## Main Task
${context.mainTask}

## Generated Files
${context.generatedFiles.map(file => `- ${file}`).join('\n')}

## Context
${context.globalContext}

## Generated on
${new Date().toISOString()}

---
*Generated by Flui AI Orchestrator*
`;
    }
    async saveContentToFile(content, extension, context, subdirectory) {
        const fileName = await this.generateFileName(content, extension, context);
        const targetDir = subdirectory ?
            path.join(context.workingDirectory, subdirectory) :
            context.workingDirectory;
        await fs.mkdir(targetDir, { recursive: true });
        const filePath = path.join(targetDir, fileName);
        await fs.writeFile(filePath, content, 'utf-8');
        const relativePath = path.relative(context.workingDirectory, filePath);
        context.generatedFiles.push(relativePath);
        return filePath;
    }
    async saveMultipleFiles(files, context) {
        const savedFiles = [];
        for (const file of files) {
            const filePath = await this.saveContentToFile(file.content, file.extension, context, file.subdirectory);
            savedFiles.push(filePath);
        }
        return savedFiles;
    }
    async createProjectSummary(context) {
        const summaryPath = path.join(context.workingDirectory, 'PROJECT_SUMMARY.md');
        const summaryContent = `# Project Summary

## Main Task
${context.mainTask}

## Completion Status
- Total Tasks: ${context.todos.length}
- Completed: ${context.completedTasks.length}
- Progress: ${((context.completedTasks.length / context.todos.length) * 100).toFixed(1)}%

## Generated Files
${context.generatedFiles.map(file => `- ${file}`).join('\n')}

## Global Context
${context.globalContext}

## Collected Data
${Object.keys(context.collectedData).length} data points collected:
${Object.keys(context.collectedData).map(key => `- ${key}`).join('\n')}

## Task Timeline
${context.completedTasks.map(task => `- ${task.description} (${task.completedAt?.toISOString()})`).join('\n')}

---
*Generated by Flui AI Orchestrator on ${new Date().toISOString()}*
`;
        await fs.writeFile(summaryPath, summaryContent, 'utf-8');
        context.generatedFiles.push('PROJECT_SUMMARY.md');
        return summaryPath;
    }
}
exports.FileGenerator = FileGenerator;
//# sourceMappingURL=fileGenerator.js.map