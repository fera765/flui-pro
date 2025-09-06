import { ITool, IToolExecutor } from '../interfaces/ITool';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export class ShellTool implements ITool, IToolExecutor {
  name = 'shell_executor';
  description = 'Execute safe shell commands within the flui project directory';
  parameters = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Shell command to execute (only safe commands allowed)'
      },
      workingDirectory: {
        type: 'string',
        description: 'Working directory relative to flui project (optional, defaults to project root)'
      }
    },
    required: ['command']
  };

  private readonly safeCommands = [
    'ls', 'dir', 'pwd', 'find', 'grep', 'cat', 'head', 'tail', 'wc', 'sort', 'uniq',
    'touch', 'mkdir', 'rmdir', 'cp', 'mv', 'rm', 'chmod', 'chown',
    'npm', 'yarn', 'pip', 'apt', 'apt-get', 'git', 'node', 'python', 'python3',
    'echo', 'printf', 'date', 'whoami', 'id', 'env', 'ps', 'top', 'htop',
    'curl', 'wget', 'tar', 'zip', 'unzip', 'gzip', 'gunzip',
    'df', 'du', 'free', 'uptime', 'uname', 'which', 'whereis', 'locate'
  ];

  private readonly dangerousPatterns = [
    /rm\s+-rf\s+\//, // rm -rf /
    /rm\s+-rf\s+\.\./, // rm -rf ..
    /rm\s+-rf\s+\*/, // rm -rf *
    /sudo\s+rm/, // sudo rm
    /sudo\s+del/, // sudo del
    /format\s+c:/, // format c:
    /mkfs/, // mkfs
    /dd\s+if=/, // dd if=
    /shutdown/, // shutdown
    /reboot/, // reboot
    /halt/, // halt
    /poweroff/, // poweroff
    /init\s+0/, // init 0
    /init\s+6/, // init 6
    /killall/, // killall
    /pkill\s+-9/, // pkill -9
    /fuser\s+-k/, // fuser -k
    /xargs\s+rm/, // xargs rm
    /exec\s+rm/, // exec rm
    /eval\s+rm/, // eval rm
    /\.\./, // path traversal
    /\/etc/, // system directories
    /\/bin/, // system directories
    /\/sbin/, // system directories
    /\/usr/, // system directories
    /\/var/, // system directories
    /\/root/, // root directory
    /\/home/, // home directory
    /\/tmp/, // temp directory
    /\/proc/, // proc directory
    /\/sys/, // sys directory
    /\/dev/, // dev directory
  ];

  async execute(parameters: Record<string, any>): Promise<string> {
    const { command, workingDirectory } = parameters;
    
    if (!command || typeof command !== 'string') {
      throw new Error('command is required and must be a string');
    }

    // Security validation
    this.validateCommand(command);
    
    // Set working directory
    const projectDir = path.join(process.cwd(), 'project');
    const workDir = workingDirectory 
      ? path.join(projectDir, this.validateAndSanitizePath(workingDirectory))
      : projectDir;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workDir,
        timeout: 30000, // 30 seconds timeout
        maxBuffer: 1024 * 1024 // 1MB max output
      });

      let result = '';
      if (stdout) result += `STDOUT:\n${stdout}\n`;
      if (stderr) result += `STDERR:\n${stderr}\n`;
      
      return result || 'Command executed successfully with no output.';
      
    } catch (error) {
      throw new Error(`Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateCommand(command: string): void {
    const trimmedCommand = command.trim();
    
    // Check for command chaining first
    if (trimmedCommand.includes('&&') || trimmedCommand.includes('||') || trimmedCommand.includes(';')) {
      throw new Error('Command chaining not allowed for security reasons');
    }

    // Check for command substitution
    if (trimmedCommand.includes('`') || trimmedCommand.includes('$(')) {
      throw new Error('Command substitution not allowed for security reasons');
    }
    
    // Check for dangerous patterns
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(trimmedCommand)) {
        throw new Error(`Dangerous command detected: ${trimmedCommand}`);
      }
    }

    // Extract the base command
    const baseCommand = trimmedCommand.split(' ')[0].toLowerCase();
    
    // Check if command is in safe list
    if (!this.safeCommands.includes(baseCommand)) {
      throw new Error(`Command not allowed: ${baseCommand}. Only safe commands are permitted.`);
    }
  }

  private validateAndSanitizePath(dirPath: string): string {
    // Remove any path traversal attempts
    const sanitized = dirPath.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Ensure path doesn't start with / or contain dangerous patterns
    if (sanitized.startsWith('/') || sanitized.includes('..')) {
      throw new Error('Invalid directory path: path traversal not allowed');
    }
    
    return sanitized;
  }
}