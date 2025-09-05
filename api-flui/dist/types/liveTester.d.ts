export interface LiveTestResult {
    success: boolean;
    projectType: 'html' | 'nodejs' | 'python' | 'other';
    buildStatus: 'success' | 'failed' | 'not_applicable';
    serverStatus: 'running' | 'stopped' | 'error' | 'not_applicable';
    serverUrl?: string;
    tests: TestExecution[];
    executedAt: Date;
    duration: number;
    errors: string[];
    warnings: string[];
}
export interface TestExecution {
    name: string;
    type: 'build' | 'server' | 'curl' | 'route' | 'custom';
    status: 'success' | 'failed' | 'skipped';
    duration: number;
    output?: string;
    error?: string;
    details?: any;
}
export interface CurlTest {
    name: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
    expectedStatus?: number;
    timeout?: number;
}
export interface RouteTest {
    name: string;
    route: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
    expectedStatus?: number;
    expectedResponse?: any;
    timeout?: number;
}
export interface BuildTest {
    name: string;
    command: string;
    workingDirectory: string;
    timeout?: number;
    expectedExitCode?: number;
}
export interface ServerTest {
    name: string;
    startCommand: string;
    workingDirectory: string;
    port?: number;
    healthCheckUrl?: string;
    timeout?: number;
    waitTime?: number;
}
export interface TestConfiguration {
    projectType: 'html' | 'nodejs' | 'python' | 'other';
    workingDirectory: string;
    buildTests?: BuildTest[];
    serverTests?: ServerTest[];
    curlTests?: CurlTest[];
    routeTests?: RouteTest[];
    customTests?: CustomTest[];
}
export interface CustomTest {
    name: string;
    command: string;
    workingDirectory: string;
    timeout?: number;
    expectedExitCode?: number;
    expectedOutput?: string;
}
export interface TestReport {
    summary: TestSummary;
    details: TestExecution[];
    recommendations: string[];
    nextSteps: string[];
}
export interface TestSummary {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    successRate: number;
}
//# sourceMappingURL=liveTester.d.ts.map