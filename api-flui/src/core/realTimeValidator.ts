import { SolutionArchitecture, ValidationResult, ValidationStepResult } from '../types/dynamic';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export class RealTimeValidator {
  async validateProject(workingDirectory: string, solution: SolutionArchitecture): Promise<ValidationResult> {
    const validations: Promise<ValidationStepResult>[] = [];
    
    // Check if it's a simple HTML project (no package.json)
    const hasPackageJson = fs.existsSync(path.join(workingDirectory, 'package.json'));
    const hasHtmlFiles = fs.readdirSync(workingDirectory).some(file => file.endsWith('.html'));
    
    if (!hasPackageJson && hasHtmlFiles) {
      // Simple HTML project validation
      validations.push(this.validateHtmlProject(workingDirectory));
    } else {
      // Standard project validation
      // Validate build
      validations.push(this.validateBuild(workingDirectory, solution.buildTool, solution.scripts.build || 'npm run build'));
      
      // Validate tests if available and jest is installed
      if (solution.scripts.test && fs.existsSync(path.join(workingDirectory, 'node_modules', 'jest'))) {
        validations.push(this.validateTests(workingDirectory, solution.buildTool, solution.scripts.test));
      }
      
      // Validate server if applicable
      if (solution.type === 'frontend' || solution.type === 'backend') {
        const port = this.getDefaultPort(solution);
        const url = `http://localhost:${port}`;
        const startCommand = solution.scripts.start;
        
        validations.push(this.validateServer(workingDirectory, port, url, startCommand));
      }
      
      // Validate linting if available
      if (solution.devDependencies.includes('eslint') || solution.devDependencies.includes('prettier')) {
        validations.push(this.validateLinting(workingDirectory, 'eslint', 'npx eslint src/'));
      }
    }
    
    // Validate logs
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

  async validateHtmlProject(workingDirectory: string): Promise<ValidationStepResult> {
    try {
      const files = fs.readdirSync(workingDirectory);
      const htmlFiles = files.filter(file => file.endsWith('.html'));
      const cssFiles = files.filter(file => file.endsWith('.css'));
      const jsFiles = files.filter(file => file.endsWith('.js'));
      
      if (htmlFiles.length === 0) {
        return {
          name: 'HTML Project',
          success: false,
          output: '',
          error: 'No HTML files found'
        };
      }
      
      // Check if index.html exists
      const hasIndex = htmlFiles.includes('index.html');
      
      return {
        name: 'HTML Project',
        success: true,
        output: `HTML files: ${htmlFiles.join(', ')}, CSS files: ${cssFiles.join(', ')}, JS files: ${jsFiles.join(', ')}`,
        error: hasIndex ? '' : 'Warning: No index.html found'
      };
    } catch (error: any) {
      return {
        name: 'HTML Project',
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  async validateBuild(workingDirectory: string, buildTool: string, command: string): Promise<ValidationStepResult> {
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: workingDirectory,
        timeout: 60000 // 60 seconds timeout
      });
      
      return {
        name: 'Build',
        success: true,
        output: stdout,
        error: stderr
      };
    } catch (error: any) {
      return {
        name: 'Build',
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message
      };
    }
  }

  async validateTests(workingDirectory: string, testTool: string, command: string): Promise<ValidationStepResult> {
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: workingDirectory,
        timeout: 30000 // 30 seconds timeout
      });
      
      return {
        name: 'Test',
        success: true,
        output: stdout,
        error: stderr
      };
    } catch (error: any) {
      return {
        name: 'Test',
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message
      };
    }
  }

  async validateServer(workingDirectory: string, port: number, url: string, startCommand?: string): Promise<ValidationStepResult> {
    try {
      // First, try to check if server is running
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { 
          cwd: workingDirectory,
          timeout: 5000 // 5 seconds timeout
        });
        
        if (stdout.trim() === '200') {
          return {
            name: 'Server',
            success: true,
            output: `Server running on port ${port}`,
            data: { port, url, statusCode: 200 }
          };
        }
      } catch (error) {
        // Server not running, try to start it
        if (startCommand) {
          try {
            await execAsync(startCommand, { 
              cwd: workingDirectory,
              timeout: 30000 // 30 seconds timeout
            });
            
            // Wait a bit for server to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check again
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
          } catch (startError: any) {
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
    } catch (error: any) {
      return {
        name: 'Server',
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message
      };
    }
  }

  async validateLinting(workingDirectory: string, lintTool: string, command: string): Promise<ValidationStepResult> {
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: workingDirectory,
        timeout: 30000 // 30 seconds timeout
      });
      
      return {
        name: 'Linting',
        success: true,
        output: stdout,
        error: stderr
      };
    } catch (error: any) {
      return {
        name: 'Linting',
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message
      };
    }
  }

  async validateLogs(workingDirectory: string, logFile: string): Promise<ValidationStepResult> {
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
    } catch (error: any) {
      return {
        name: 'Logs',
        success: false,
        output: '',
        error: error.message
      };
    }
  }

  private getDefaultPort(solution: SolutionArchitecture): number {
    if (solution.type === 'frontend') {
      return 3000;
    } else if (solution.type === 'backend') {
      if (solution.framework === 'express') {
        return 3000;
      } else if (solution.framework === 'fastapi') {
        return 8000;
      } else if (solution.framework === 'django') {
        return 8000;
      } else if (solution.framework === 'spring') {
        return 8080;
      } else if (solution.framework === 'rails') {
        return 3000;
      } else if (solution.framework === 'gin') {
        return 8080;
      } else if (solution.framework === 'actix') {
        return 8080;
      }
    }
    return 3000; // Default port
  }

  private getServerUrl(results: ValidationStepResult[]): string | undefined {
    const serverResult = results.find(r => r.name === 'Server' && r.success);
    if (serverResult && serverResult.data) {
      return serverResult.data.url;
    }
    return undefined;
  }
}