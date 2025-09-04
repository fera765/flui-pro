export interface PluginFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface Plugin {
  name: string;
  version: string;
  description: string;
  functions: PluginFunction[];
  dependencies: string[];
  path: string;
  status: 'loading' | 'installing' | 'testing' | 'active' | 'error' | 'deleted';
  error?: string;
}

export interface PluginTestResult {
  success: boolean;
  error?: string;
  testOutput?: any;
}

export interface PluginInstallResult {
  success: boolean;
  error?: string;
  installedPackages?: string[];
}