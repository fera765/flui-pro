import { FluiContext, TodoItem, AgentTask } from '../types/advanced';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

export class FluiContextManager {
  private context: FluiContext;

  constructor(mainTask: string, workingDirectory: string) {
    this.context = {
      mainTask,
      mainTaskId: uuidv4(),
      todos: [],
      completedTasks: [],
      globalContext: '',
      collectedData: {},
      workingDirectory,
      generatedFiles: []
    };
  }

  getContext(): FluiContext {
    return this.context;
  }

  updateGlobalContext(newContext: string): void {
    this.context.globalContext += `\n${new Date().toISOString()}: ${newContext}`;
  }

  addCollectedData(key: string, data: any): void {
    this.context.collectedData[key] = data;
  }

  getCollectedData(key: string): any {
    return this.context.collectedData[key];
  }

  getAllCollectedData(): Record<string, any> {
    return this.context.collectedData;
  }

  addTodo(todo: TodoItem): void {
    this.context.todos.push(todo);
  }

  addTodos(todos: TodoItem[]): void {
    this.context.todos.push(...todos);
  }

  updateTodoStatus(todoId: string, status: TodoItem['status'], result?: any, error?: string): void {
    console.log(`📝 Updating todo ${todoId} status from ${this.context.todos.find(t => t.id === todoId)?.status} to ${status}`);
    const todo = this.context.todos.find(t => t.id === todoId);
    if (todo) {
      const oldStatus = todo.status;
      todo.status = status;
      if (result) todo.result = result;
      if (error) todo.error = error;
      if (status === 'completed' || status === 'failed') {
        todo.completedAt = new Date();
        this.context.completedTasks.push(todo);
        console.log(`✅ Todo ${todoId} marked as ${status} and added to completedTasks`);
      }
      console.log(`📝 Todo ${todoId} status updated: ${oldStatus} -> ${status}`);
    } else {
      console.log(`❌ Todo ${todoId} not found in context`);
    }
  }

  getNextExecutableTodos(): TodoItem[] {
    const executable = this.context.todos.filter(todo => {
      if (todo.status !== 'pending') return false;
      
      const allDepsCompleted = todo.dependencies.every(depId => {
        const depTodo = this.context.todos.find(t => t.id === depId);
        const isCompleted = depTodo?.status === 'completed';
        if (!isCompleted) {
          console.log(`❌ Todo ${todo.id} blocked by dependency ${depId} (status: ${depTodo?.status || 'not found'})`);
        }
        return isCompleted;
      });
      
      if (allDepsCompleted) {
        console.log(`✅ Todo ${todo.id} is executable`);
      }
      
      return allDepsCompleted;
    });
    
    console.log(`📋 Found ${executable.length} executable todos out of ${this.context.todos.length} total`);
    return executable;
  }

  isTaskComplete(): boolean {
    // Task is complete when all todos are either completed or failed
    // (no pending todos remaining)
    const allComplete = this.context.todos.every(todo => 
      todo.status === 'completed' || todo.status === 'failed'
    );
    
    console.log(`🔍 Checking if task is complete:`);
    console.log(`  Total todos: ${this.context.todos.length}`);
    this.context.todos.forEach(todo => {
      console.log(`  - ${todo.id}: ${todo.status}`);
    });
    console.log(`  All complete: ${allComplete}`);
    
    return allComplete;
  }

  addGeneratedFile(filePath: string): void {
    this.context.generatedFiles.push(filePath);
  }

  getGeneratedFiles(): string[] {
    return this.context.generatedFiles;
  }

  async saveContextToFile(): Promise<void> {
    const contextFile = path.join(this.context.workingDirectory, 'flui_context.json');
    await fs.writeFile(contextFile, JSON.stringify(this.context, null, 2), 'utf-8');
  }

  async loadContextFromFile(): Promise<void> {
    const contextFile = path.join(this.context.workingDirectory, 'flui_context.json');
    try {
      const data = await fs.readFile(contextFile, 'utf-8');
      this.context = JSON.parse(data);
    } catch (error) {
      // Context file doesn't exist or is invalid, keep current context
    }
  }

  generateSummary(): string {
    const completedCount = this.context.completedTasks.length;
    const totalCount = this.context.todos.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return `
# Flui Task Summary

## Main Task
${this.context.mainTask}

## Progress
- Completed: ${completedCount}/${totalCount} (${progress.toFixed(1)}%)
- Generated Files: ${this.context.generatedFiles.length}

## Global Context
${this.context.globalContext}

## Collected Data
${Object.keys(this.context.collectedData).length} data points collected

## Generated Files
${this.context.generatedFiles.map(file => `- ${file}`).join('\n')}
    `.trim();
  }

  createAgentTask(agentId: string, prompt: string, tools: string[]): AgentTask {
    return {
      id: uuidv4(),
      agentId,
      prompt,
      context: this.context.globalContext,
      systemPrompt: `You are working on: ${this.context.mainTask}\n\nContext: ${this.context.globalContext}`,
      tools,
      status: 'pending',
      createdAt: new Date()
    };
  }

  updateCurrentAgent(agentId: string): void {
    this.context.currentAgent = agentId;
  }

  getCurrentAgent(): string | undefined {
    return this.context.currentAgent;
  }

  getWorkingDirectory(): string {
    return this.context.workingDirectory;
  }

  async ensureWorkingDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.context.workingDirectory, { recursive: true });
    } catch (error) {
      // Directory already exists or creation failed
    }
  }
}