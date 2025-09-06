"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveTester = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const axios_1 = __importDefault(require("axios"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class LiveTester {
    constructor() {
        this.runningServers = new Map();
    }
    async testProject(config) {
        const startTime = Date.now();
        const tests = [];
        const errors = [];
        const warnings = [];
        try {
            console.log(`🧪 Starting live tests for ${config.projectType} project`);
            if (config.buildTests && config.buildTests.length > 0) {
                console.log(`🔨 Running ${config.buildTests.length} build tests`);
                for (const buildTest of config.buildTests) {
                    const result = await this.executeBuildTest(buildTest);
                    tests.push(result);
                    if (result.status === 'failed') {
                        errors.push(`Build test failed: ${buildTest.name} - ${result.error}`);
                    }
                }
            }
            if (config.serverTests && config.serverTests.length > 0) {
                console.log(`🚀 Running ${config.serverTests.length} server tests`);
                for (const serverTest of config.serverTests) {
                    const result = await this.executeServerTest(serverTest);
                    tests.push(result);
                    if (result.status === 'failed') {
                        errors.push(`Server test failed: ${serverTest.name} - ${result.error}`);
                    }
                }
            }
            if (config.curlTests && config.curlTests.length > 0) {
                console.log(`🌐 Running ${config.curlTests.length} curl tests`);
                for (const curlTest of config.curlTests) {
                    const result = await this.executeCurlTest(curlTest);
                    tests.push(result);
                    if (result.status === 'failed') {
                        errors.push(`Curl test failed: ${curlTest.name} - ${result.error}`);
                    }
                }
            }
            if (config.routeTests && config.routeTests.length > 0) {
                console.log(`🛣️ Running ${config.routeTests.length} route tests`);
                for (const routeTest of config.routeTests) {
                    const result = await this.executeRouteTest(routeTest);
                    tests.push(result);
                    if (result.status === 'failed') {
                        errors.push(`Route test failed: ${routeTest.name} - ${result.error}`);
                    }
                }
            }
            const buildStatus = this.determineBuildStatus(tests, config.projectType);
            const serverStatus = this.determineServerStatus(tests, config.projectType);
            const success = errors.length === 0 && tests.every(t => t.status !== 'failed');
            const duration = Date.now() - startTime;
            const result = {
                success,
                projectType: config.projectType,
                buildStatus,
                serverStatus,
                tests,
                executedAt: new Date(),
                duration,
                errors,
                warnings
            };
            console.log(`✅ Live tests completed in ${duration}ms - Success: ${success}`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            errors.push(`Test execution failed: ${error.message}`);
            return {
                success: false,
                projectType: config.projectType,
                buildStatus: 'failed',
                serverStatus: 'error',
                tests,
                executedAt: new Date(),
                duration,
                errors,
                warnings
            };
        }
    }
    async executeBuildTest(buildTest) {
        const startTime = Date.now();
        try {
            console.log(`🔨 Executing build test: ${buildTest.name}`);
            const { stdout, stderr } = await execAsync(buildTest.command, {
                cwd: buildTest.workingDirectory,
                timeout: buildTest.timeout || 30000
            });
            const duration = Date.now() - startTime;
            const exitCode = 0;
            return {
                name: buildTest.name,
                type: 'build',
                status: 'success',
                duration,
                output: stdout,
                details: { exitCode, stderr }
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                name: buildTest.name,
                type: 'build',
                status: 'failed',
                duration,
                error: error.message,
                output: error.stdout || error.stderr
            };
        }
    }
    async executeServerTest(serverTest) {
        const startTime = Date.now();
        let serverProcess = null;
        try {
            console.log(`🚀 Starting server test: ${serverTest.name}`);
            const { spawn } = require('child_process');
            const [command, ...args] = serverTest.startCommand.split(' ');
            serverProcess = spawn(command, args, {
                cwd: serverTest.workingDirectory,
                stdio: 'pipe',
                detached: false
            });
            const processId = `server-${Date.now()}`;
            this.runningServers.set(processId, serverProcess);
            if (serverTest.waitTime) {
                await new Promise(resolve => setTimeout(resolve, serverTest.waitTime));
            }
            let healthCheckResult = null;
            if (serverTest.healthCheckUrl) {
                try {
                    const response = await axios_1.default.get(serverTest.healthCheckUrl, {
                        timeout: 5000
                    });
                    healthCheckResult = {
                        status: response.status,
                        data: response.data
                    };
                }
                catch (error) {
                    console.log(`⚠️ Health check failed: ${error.message}`);
                }
            }
            const duration = Date.now() - startTime;
            if (serverProcess) {
                serverProcess.kill();
                this.runningServers.delete(processId);
            }
            return {
                name: serverTest.name,
                type: 'server',
                status: 'success',
                duration,
                details: {
                    port: serverTest.port,
                    healthCheck: healthCheckResult
                }
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            if (serverProcess) {
                serverProcess.kill();
            }
            return {
                name: serverTest.name,
                type: 'server',
                status: 'failed',
                duration,
                error: error.message
            };
        }
    }
    async executeCurlTest(curlTest) {
        const startTime = Date.now();
        try {
            console.log(`🌐 Executing curl test: ${curlTest.name}`);
            const response = await (0, axios_1.default)({
                method: curlTest.method,
                url: curlTest.url,
                headers: curlTest.headers,
                data: curlTest.body,
                timeout: curlTest.timeout || 5000,
                validateStatus: () => true
            });
            const duration = Date.now() - startTime;
            const success = !curlTest.expectedStatus || response.status === curlTest.expectedStatus;
            return {
                name: curlTest.name,
                type: 'curl',
                status: success ? 'success' : 'failed',
                duration,
                details: {
                    status: response.status,
                    headers: response.headers,
                    data: response.data
                },
                error: success ? undefined : `Expected status ${curlTest.expectedStatus}, got ${response.status}`
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                name: curlTest.name,
                type: 'curl',
                status: 'failed',
                duration,
                error: error.message
            };
        }
    }
    async executeRouteTest(routeTest) {
        const startTime = Date.now();
        try {
            console.log(`🛣️ Executing route test: ${routeTest.name}`);
            const response = await (0, axios_1.default)({
                method: routeTest.method,
                url: routeTest.route,
                headers: routeTest.headers,
                data: routeTest.body,
                timeout: routeTest.timeout || 5000,
                validateStatus: () => true
            });
            const duration = Date.now() - startTime;
            const success = !routeTest.expectedStatus || response.status === routeTest.expectedStatus;
            return {
                name: routeTest.name,
                type: 'route',
                status: success ? 'success' : 'failed',
                duration,
                details: {
                    status: response.status,
                    headers: response.headers,
                    data: response.data
                },
                error: success ? undefined : `Expected status ${routeTest.expectedStatus}, got ${response.status}`
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                name: routeTest.name,
                type: 'route',
                status: 'failed',
                duration,
                error: error.message
            };
        }
    }
    determineBuildStatus(tests, projectType) {
        if (projectType === 'html') {
            return 'not_applicable';
        }
        const buildTests = tests.filter(t => t.type === 'build');
        if (buildTests.length === 0) {
            return 'not_applicable';
        }
        return buildTests.every(t => t.status === 'success') ? 'success' : 'failed';
    }
    determineServerStatus(tests, projectType) {
        if (projectType === 'html') {
            return 'not_applicable';
        }
        const serverTests = tests.filter(t => t.type === 'server');
        if (serverTests.length === 0) {
            return 'not_applicable';
        }
        const hasRunningServer = serverTests.some(t => t.status === 'success');
        return hasRunningServer ? 'running' : 'error';
    }
    generateTestReport(result) {
        const summary = {
            total: result.tests.length,
            passed: result.tests.filter(t => t.status === 'success').length,
            failed: result.tests.filter(t => t.status === 'failed').length,
            skipped: result.tests.filter(t => t.status === 'skipped').length,
            duration: result.duration,
            successRate: result.tests.length > 0 ?
                (result.tests.filter(t => t.status === 'success').length / result.tests.length) * 100 : 0
        };
        const recommendations = [];
        const nextSteps = [];
        if (result.buildStatus === 'failed') {
            recommendations.push('Fix build errors before proceeding');
            nextSteps.push('Check package.json and dependencies');
        }
        if (result.serverStatus === 'error') {
            recommendations.push('Fix server startup issues');
            nextSteps.push('Check server configuration and ports');
        }
        const failedTests = result.tests.filter(t => t.status === 'failed');
        if (failedTests.length > 0) {
            recommendations.push(`Address ${failedTests.length} failed test(s)`);
            nextSteps.push('Review test errors and fix issues');
        }
        if (result.success) {
            recommendations.push('All tests passed successfully');
            nextSteps.push('Project is ready for deployment');
        }
        return {
            summary,
            details: result.tests,
            recommendations,
            nextSteps
        };
    }
    async cleanup() {
        const cleanupPromises = Array.from(this.runningServers.entries()).map(async ([id, server]) => {
            try {
                if (server && server.kill) {
                    server.kill();
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            catch (error) {
                console.error(`Error cleaning up server ${id}:`, error);
            }
        });
        await Promise.all(cleanupPromises);
        this.runningServers.clear();
    }
    async killProcessOnPort(port) {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            const command = process.platform === 'win32'
                ? `netstat -ano | findstr :${port}`
                : `lsof -ti:${port}`;
            const { stdout } = await execAsync(command);
            if (stdout.trim()) {
                const pid = process.platform === 'win32'
                    ? stdout.split('\n')[0].split(/\s+/).pop()
                    : stdout.trim();
                if (pid) {
                    const killCommand = process.platform === 'win32'
                        ? `taskkill /PID ${pid} /F`
                        : `kill -9 ${pid}`;
                    await execAsync(killCommand);
                    console.log(`Killed process ${pid} on port ${port}`);
                }
            }
        }
        catch (error) {
            console.log(`No process found on port ${port}`);
        }
    }
}
exports.LiveTester = LiveTester;
//# sourceMappingURL=liveTester.js.map