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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeValidator = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class RealTimeValidator {
    async validateProject(workingDirectory, solution) {
        const validations = [];
        validations.push(this.validateBuild(workingDirectory, solution.buildTool, solution.scripts.build || 'npm run build'));
        if (solution.scripts.test) {
            validations.push(this.validateTests(workingDirectory, solution.buildTool, solution.scripts.test));
        }
        if (solution.type === 'frontend' || solution.type === 'backend') {
            const port = this.getDefaultPort(solution);
            const url = `http://localhost:${port}`;
            const startCommand = solution.scripts.start;
            validations.push(this.validateServer(workingDirectory, port, url, startCommand));
        }
        if (solution.devDependencies.includes('eslint') || solution.devDependencies.includes('prettier')) {
            validations.push(this.validateLinting(workingDirectory, 'eslint', 'npx eslint src/'));
        }
        validations.push(this.validateLogs(workingDirectory, 'app.log'));
        const results = await Promise.all(validations);
        return {
            isValid: results.every(r => r.success),
            steps: results,
            errors: results.filter(r => !r.success).map(r => r.error || 'Unknown error'),
            warnings: results.filter(r => r.warning).map(r => r.warning || ''),
            serverUrl: this.getServerUrl(results)
        };
    }
    async validateBuild(workingDirectory, buildTool, command) {
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: workingDirectory,
                timeout: 60000
            });
            return {
                name: 'Build',
                success: true,
                output: stdout,
                error: stderr
            };
        }
        catch (error) {
            return {
                name: 'Build',
                success: false,
                output: error.stdout || '',
                error: error.stderr || error.message
            };
        }
    }
    async validateTests(workingDirectory, testTool, command) {
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: workingDirectory,
                timeout: 30000
            });
            return {
                name: 'Test',
                success: true,
                output: stdout,
                error: stderr
            };
        }
        catch (error) {
            return {
                name: 'Test',
                success: false,
                output: error.stdout || '',
                error: error.stderr || error.message
            };
        }
    }
    async validateServer(workingDirectory, port, url, startCommand) {
        try {
            try {
                const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, {
                    cwd: workingDirectory,
                    timeout: 5000
                });
                if (stdout.trim() === '200') {
                    return {
                        name: 'Server',
                        success: true,
                        output: `Server running on port ${port}`,
                        data: { port, url, statusCode: 200 }
                    };
                }
            }
            catch (error) {
                if (startCommand) {
                    try {
                        await execAsync(startCommand, {
                            cwd: workingDirectory,
                            timeout: 30000
                        });
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, {
                            cwd: workingDirectory,
                            timeout: 5000
                        });
                        if (stdout.trim() === '200') {
                            return {
                                name: 'Server',
                                success: true,
                                output: `Server started and running on port ${port}`,
                                data: { port, url, statusCode: 200, started: true }
                            };
                        }
                    }
                    catch (startError) {
                        return {
                            name: 'Server',
                            success: false,
                            output: startError.stdout || '',
                            error: startError.stderr || startError.message
                        };
                    }
                }
            }
            return {
                name: 'Server',
                success: false,
                output: '',
                error: 'Server not accessible'
            };
        }
        catch (error) {
            return {
                name: 'Server',
                success: false,
                output: error.stdout || '',
                error: error.stderr || error.message
            };
        }
    }
    async validateLinting(workingDirectory, lintTool, command) {
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: workingDirectory,
                timeout: 30000
            });
            return {
                name: 'Linting',
                success: true,
                output: stdout,
                error: stderr
            };
        }
        catch (error) {
            return {
                name: 'Linting',
                success: false,
                output: error.stdout || '',
                error: error.stderr || error.message
            };
        }
    }
    async validateLogs(workingDirectory, logFile) {
        try {
            const logPath = path.join(workingDirectory, logFile);
            if (!fs.existsSync(logPath)) {
                return {
                    name: 'Logs',
                    success: true,
                    output: 'Log file not found',
                    data: { hasErrors: false, message: 'Log file not found' }
                };
            }
            const logContent = fs.readFileSync(logPath, 'utf-8');
            const errorPatterns = [
                /error/i,
                /exception/i,
                /failed/i,
                /fatal/i,
                /critical/i
            ];
            const errors = logContent
                .split('\n')
                .filter(line => errorPatterns.some(pattern => pattern.test(line)))
                .map(line => line.trim())
                .filter(line => line.length > 0);
            if (errors.length > 0) {
                return {
                    name: 'Logs',
                    success: false,
                    output: `Found ${errors.length} errors in logs`,
                    error: errors.join('\n'),
                    data: { hasErrors: true, errors }
                };
            }
            return {
                name: 'Logs',
                success: true,
                output: 'No errors found in logs',
                data: { hasErrors: false, errors: [] }
            };
        }
        catch (error) {
            return {
                name: 'Logs',
                success: false,
                output: '',
                error: error.message
            };
        }
    }
    getDefaultPort(solution) {
        if (solution.type === 'frontend') {
            return 3000;
        }
        else if (solution.type === 'backend') {
            if (solution.framework === 'express') {
                return 3000;
            }
            else if (solution.framework === 'fastapi') {
                return 8000;
            }
            else if (solution.framework === 'django') {
                return 8000;
            }
            else if (solution.framework === 'spring') {
                return 8080;
            }
            else if (solution.framework === 'rails') {
                return 3000;
            }
            else if (solution.framework === 'gin') {
                return 8080;
            }
            else if (solution.framework === 'actix') {
                return 8080;
            }
        }
        return 3000;
    }
    getServerUrl(results) {
        const serverResult = results.find(r => r.name === 'Server' && r.success);
        if (serverResult && serverResult.data) {
            return serverResult.data.url;
        }
        return undefined;
    }
}
exports.RealTimeValidator = RealTimeValidator;
//# sourceMappingURL=realTimeValidator.js.map