import { FluiContext, TodoItem } from '../types/advanced';
import { AdvancedTools } from '../tools/advancedTools';

export class AutoCorrectionSystem {
  private tools: AdvancedTools;
  private errorPatterns: Map<string, string> = new Map();

  constructor(workingDirectory: string) {
    this.tools = new AdvancedTools(workingDirectory);
    this.initializeErrorPatterns();
  }

  private initializeErrorPatterns(): void {
    this.errorPatterns.set('timeout', 'Task timeout - retry with longer timeout');
    this.errorPatterns.set('network', 'Network error - retry with exponential backoff');
    this.errorPatterns.set('permission', 'Permission error - check file permissions');
    this.errorPatterns.set('not found', 'Resource not found - verify path or create resource');
    this.errorPatterns.set('invalid', 'Invalid input - validate parameters');
    this.errorPatterns.set('rate limit', 'Rate limit exceeded - wait and retry');
  }

  async analyzeError(error: string, context: FluiContext): Promise<{
    diagnosis: string;
    solution: string;
    shouldRetry: boolean;
    retryDelay?: number;
  }> {
    const diagnosis = this.diagnoseError(error);
    const solution = this.generateSolution(diagnosis, context);
    const shouldRetry = this.shouldRetryError(error);
    const retryDelay = this.calculateRetryDelay(error);

    return {
      diagnosis,
      solution,
      shouldRetry,
      retryDelay
    };
  }

  private diagnoseError(error: string): string {
    const lowerError = error.toLowerCase();
    
    for (const [pattern, description] of this.errorPatterns) {
      if (lowerError.includes(pattern)) {
        return description;
      }
    }

    return 'Unknown error - manual investigation required';
  }

  private generateSolution(diagnosis: string, context: FluiContext): string {
    switch (diagnosis) {
      case 'Task timeout - retry with longer timeout':
        return 'Increase timeout and retry the task';
      
      case 'Network error - retry with exponential backoff':
        return 'Wait and retry with exponential backoff';
      
      case 'Permission error - check file permissions':
        return 'Check and fix file permissions in working directory';
      
      case 'Resource not found - verify path or create resource':
        return 'Verify resource path or create missing resources';
      
      case 'Invalid input - validate parameters':
        return 'Validate and correct input parameters';
      
      case 'Rate limit exceeded - wait and retry':
        return 'Wait for rate limit reset and retry';
      
      default:
        return 'Manual intervention required - check logs for details';
    }
  }

  private shouldRetryError(error: string): boolean {
    const retryableErrors = ['timeout', 'network', 'rate limit', 'temporary'];
    const lowerError = error.toLowerCase();
    
    return retryableErrors.some(pattern => lowerError.includes(pattern));
  }

  private calculateRetryDelay(error: string): number {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('rate limit')) {
      return 60000; // 1 minute
    } else if (lowerError.includes('timeout')) {
      return 5000; // 5 seconds
    } else if (lowerError.includes('network')) {
      return 10000; // 10 seconds
    }
    
    return 2000; // Default 2 seconds
  }

  async executeCorrection(solution: string, context: FluiContext): Promise<boolean> {
    try {
      if (solution.includes('check file permissions')) {
        return await this.fixFilePermissions(context.workingDirectory);
      } else if (solution.includes('create missing resources')) {
        return await this.createMissingResources(context);
      } else if (solution.includes('validate parameters')) {
        return await this.validateParameters(context);
      }
      
      return false; // Manual intervention required
    } catch (error) {
      console.error('Auto-correction failed:', error);
      return false;
    }
  }

  private async fixFilePermissions(workingDirectory: string): Promise<boolean> {
    try {
      // Use shell tool to fix permissions
      const shellTool = this.tools.createShellTool();
      const result = await shellTool.execute({ command: `chmod -R 755 ${workingDirectory}` });
      return result.success;
    } catch (error) {
      return false;
    }
  }

  private async createMissingResources(context: FluiContext): Promise<boolean> {
    try {
      // Create necessary directories and files
      const shellTool = this.tools.createShellTool();
      await shellTool.execute({ command: `mkdir -p ${context.workingDirectory}` });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async validateParameters(context: FluiContext): Promise<boolean> {
    // Validate parameters in todos
    for (const todo of context.todos) {
      if (todo.parameters) {
        // Basic parameter validation
        if (typeof todo.parameters !== 'object') {
          todo.parameters = {};
        }
      }
    }
    return true;
  }

  async monitorLogs(context: FluiContext): Promise<void> {
    // Monitor logs for errors and apply auto-correction
    const shellTool = this.tools.createShellTool();
    
    try {
      const result = await shellTool.execute({ 
        command: `tail -n 50 ${context.workingDirectory}/flui.log 2>/dev/null || echo "No log file found"` 
      });
      
      if (result.success && result.data?.stdout) {
        const logContent = result.data.stdout;
        const errors = this.extractErrors(logContent);
        
        for (const error of errors) {
          const analysis = await this.analyzeError(error, context);
          if (analysis.shouldRetry) {
            console.log(`Auto-correction: ${analysis.diagnosis} - ${analysis.solution}`);
            await this.executeCorrection(analysis.solution, context);
          }
        }
      }
    } catch (error) {
      // Log monitoring failed, continue execution
    }
  }

  private extractErrors(logContent: string): string[] {
    const errorLines = logContent.split('\n').filter(line => 
      line.toLowerCase().includes('error') || 
      line.toLowerCase().includes('failed') ||
      line.toLowerCase().includes('exception')
    );
    
    return errorLines;
  }

  async retryFailedTodo(todo: TodoItem, context: FluiContext): Promise<boolean> {
    try {
      // Reset todo status
      todo.status = 'pending';
      delete todo.error;
      
      // Apply any necessary corrections
      if (todo.error) {
        const analysis = await this.analyzeError(todo.error, context);
        if (analysis.shouldRetry) {
          await this.executeCorrection(analysis.solution, context);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}