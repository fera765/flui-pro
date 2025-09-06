import { LiveTestResult, TestConfiguration, TestReport } from '../types/liveTester';
export declare class LiveTester {
    private runningServers;
    testProject(config: TestConfiguration): Promise<LiveTestResult>;
    private executeBuildTest;
    private executeServerTest;
    private executeCurlTest;
    private executeRouteTest;
    private determineBuildStatus;
    private determineServerStatus;
    generateTestReport(result: LiveTestResult): TestReport;
    cleanup(): Promise<void>;
    killProcessOnPort(port: number): Promise<void>;
}
//# sourceMappingURL=liveTester.d.ts.map