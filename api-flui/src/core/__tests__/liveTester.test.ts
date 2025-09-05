import { LiveTester } from '../liveTester';
import { TestConfiguration, LiveTestResult } from '../../types/liveTester';
import * as fs from 'fs';
import * as path from 'path';

describe('LiveTester', () => {
  const testDir = '/tmp/flui-live-tester-test';
  let liveTester: LiveTester;

  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    liveTester = new LiveTester();
    
    // Clean up any running servers
    await liveTester.cleanup();
  });

  afterEach(async () => {
    // Clean up any running servers
    await liveTester.cleanup();
    
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('testHTMLProject', () => {
    it('should test HTML project with curl', async () => {
      // Arrange - Create a simple HTML project
      const htmlProjectDir = path.join(testDir, 'html-project');
      fs.mkdirSync(htmlProjectDir, { recursive: true });
      
      // Create index.html
      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a test page</p>
</body>
</html>`;
      fs.writeFileSync(path.join(htmlProjectDir, 'index.html'), htmlContent);

      // Create style.css
      const cssContent = `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

h1 {
    color: #333;
    text-align: center;
}`;
      fs.writeFileSync(path.join(htmlProjectDir, 'style.css'), cssContent);

      // Create script.js
      const jsContent = `document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded successfully');
    document.body.style.backgroundColor = '#ffffff';
});`;
      fs.writeFileSync(path.join(htmlProjectDir, 'script.js'), jsContent);

      const config: TestConfiguration = {
        projectType: 'html',
        workingDirectory: htmlProjectDir,
        curlTests: [
          {
            name: 'Test HTML page access',
            url: 'http://localhost:8080',
            method: 'GET',
            expectedStatus: 200,
            timeout: 5000
          }
        ]
      };

      // Act
      const result = await liveTester.testProject(config);

      // Assert
      expect(result).toBeDefined();
      expect(result.projectType).toBe('html');
      expect(result.buildStatus).toBe('not_applicable');
      expect(result.tests).toBeDefined();
      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.executedAt).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThan(0);
    }, 30000);

    it('should handle HTML project without server', async () => {
      // Arrange - Create HTML files without server
      const htmlProjectDir = path.join(testDir, 'html-static');
      fs.mkdirSync(htmlProjectDir, { recursive: true });
      
      const htmlContent = `<!DOCTYPE html>
<html>
<head><title>Static Page</title></head>
<body><h1>Static Content</h1></body>
</html>`;
      fs.writeFileSync(path.join(htmlProjectDir, 'index.html'), htmlContent);

      const config: TestConfiguration = {
        projectType: 'html',
        workingDirectory: htmlProjectDir
      };

      // Act
      const result = await liveTester.testProject(config);

      // Assert
      expect(result).toBeDefined();
      expect(result.projectType).toBe('html');
      expect(result.buildStatus).toBe('not_applicable');
      expect(result.serverStatus).toBe('not_applicable');
      expect(result.success).toBe(true);
    });
  });

  describe('testNodeJSProject', () => {
    it('should test Node.js project with build and routes', async () => {
      // Arrange - Create a simple Node.js project
      const nodeProjectDir = path.join(testDir, 'node-project');
      fs.mkdirSync(nodeProjectDir, { recursive: true });
      
      // Create package.json
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          test: 'echo "No tests specified"'
        },
        dependencies: {
          express: '^4.18.0'
        }
      };
      fs.writeFileSync(
        path.join(nodeProjectDir, 'package.json'), 
        JSON.stringify(packageJson, null, 2)
      );

      // Create index.js
      const indexJs = `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;
      fs.writeFileSync(path.join(nodeProjectDir, 'index.js'), indexJs);

      const config: TestConfiguration = {
        projectType: 'nodejs',
        workingDirectory: nodeProjectDir,
        buildTests: [
          {
            name: 'Install dependencies',
            command: 'npm install',
            workingDirectory: nodeProjectDir,
            timeout: 15000
          }
        ]
      };

      // Act
      const result = await liveTester.testProject(config);

      // Assert
      expect(result).toBeDefined();
      expect(result.projectType).toBe('nodejs');
      expect(result.tests).toBeDefined();
      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.executedAt).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThan(0);
      
      // Check if build test was executed
      const buildTests = result.tests.filter(t => t.type === 'build');
      expect(buildTests.length).toBeGreaterThan(0);
    }, 30000);

    it('should handle Node.js project build failure', async () => {
      // Arrange - Create invalid Node.js project
      const nodeProjectDir = path.join(testDir, 'node-invalid');
      fs.mkdirSync(nodeProjectDir, { recursive: true });
      
      // Create invalid package.json
      const invalidPackageJson = `{
        "name": "invalid-project",
        "version": "1.0.0",
        "main": "index.js",
        "scripts": {
          "start": "node index.js"
        },
        "dependencies": {
          "nonexistent-package": "^999.999.999"
        }
      }`;
      fs.writeFileSync(path.join(nodeProjectDir, 'package.json'), invalidPackageJson);

      const config: TestConfiguration = {
        projectType: 'nodejs',
        workingDirectory: nodeProjectDir,
        buildTests: [
          {
            name: 'Install dependencies (should fail)',
            command: 'npm install',
            workingDirectory: nodeProjectDir,
            timeout: 10000
          }
        ]
      };

      // Act
      const result = await liveTester.testProject(config);

      // Assert
      expect(result).toBeDefined();
      expect(result.projectType).toBe('nodejs');
      expect(result.buildStatus).toBe('failed');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('testProject', () => {
    it('should handle unknown project type gracefully', async () => {
      // Arrange
      const config: TestConfiguration = {
        projectType: 'other',
        workingDirectory: testDir
      };

      // Act
      const result = await liveTester.testProject(config);

      // Assert
      expect(result).toBeDefined();
      expect(result.projectType).toBe('other');
      expect(result.buildStatus).toBe('not_applicable');
      expect(result.serverStatus).toBe('not_applicable');
      expect(result.success).toBe(true);
    });

    it('should generate test report', async () => {
      // Arrange
      const config: TestConfiguration = {
        projectType: 'html',
        workingDirectory: testDir
      };

      // Act
      const result = await liveTester.testProject(config);
      const report = liveTester.generateTestReport(result);

      // Assert
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBeGreaterThanOrEqual(0);
      expect(report.summary.passed).toBeGreaterThanOrEqual(0);
      expect(report.summary.failed).toBeGreaterThanOrEqual(0);
      expect(report.summary.successRate).toBeGreaterThanOrEqual(0);
      expect(report.summary.successRate).toBeLessThanOrEqual(100);
      expect(report.details).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.nextSteps).toBeDefined();
    });
  });
});