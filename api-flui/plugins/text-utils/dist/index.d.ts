interface PluginFunction {
    name: string;
    description: string;
    parameters: Record<string, any>;
    execute: (params: any) => Promise<any>;
}
interface Plugin {
    name: string;
    version: string;
    description: string;
    functions: PluginFunction[];
    dependencies: string[];
    path: string;
    status: 'loading' | 'installing' | 'testing' | 'active' | 'error' | 'deleted';
    error?: string;
}
export declare const reverseText: PluginFunction;
export declare const countWords: PluginFunction;
export declare const textToUppercase: PluginFunction;
export declare const plugin: Plugin;
export {};
//# sourceMappingURL=index.d.ts.map