"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.calculateExpression = exports.calculate = void 0;
exports.calculate = {
    name: 'calculate',
    description: 'Perform basic mathematical calculations (add, subtract, multiply, divide)',
    parameters: {
        operation: {
            type: 'string',
            required: true,
            description: 'Mathematical operation: add, subtract, multiply, divide'
        },
        a: {
            type: 'number',
            required: true,
            description: 'First number'
        },
        b: {
            type: 'number',
            required: true,
            description: 'Second number'
        }
    },
    execute: async (params) => {
        const { operation, a, b } = params;
        let result;
        switch (operation.toLowerCase()) {
            case 'add':
            case '+':
                result = a + b;
                break;
            case 'subtract':
            case '-':
                result = a - b;
                break;
            case 'multiply':
            case '*':
                result = a * b;
                break;
            case 'divide':
            case '/':
                if (b === 0) {
                    throw new Error('Division by zero is not allowed');
                }
                result = a / b;
                break;
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }
        return {
            operation: `${a} ${operation} ${b}`,
            result: result,
            formatted: `${a} ${operation} ${b} = ${result}`
        };
    }
};
exports.calculateExpression = {
    name: 'calculateExpression',
    description: 'Calculate a mathematical expression string',
    parameters: {
        expression: {
            type: 'string',
            required: true,
            description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")'
        }
    },
    execute: async (params) => {
        const { expression } = params;
        // Simple expression evaluator (for basic operations)
        // Note: In production, you'd want to use a proper math parser
        try {
            // Basic validation - only allow numbers, operators, and parentheses
            if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
                throw new Error('Invalid characters in expression');
            }
            // Use eval for simple expressions (be careful in production!)
            const result = eval(expression);
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('Invalid expression result');
            }
            return {
                expression: expression,
                result: result,
                formatted: `${expression} = ${result}`
            };
        }
        catch (error) {
            throw new Error(`Failed to evaluate expression: ${error.message}`);
        }
    }
};
exports.plugin = {
    name: 'calculator',
    version: '1.0.0',
    description: 'Calculator plugin providing basic mathematical operations',
    functions: [exports.calculate, exports.calculateExpression],
    dependencies: [],
    path: '',
    status: 'active'
};
//# sourceMappingURL=index.js.map