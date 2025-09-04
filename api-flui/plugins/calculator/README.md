# Calculator Plugin

## Description
A simple calculator plugin for Flui that provides basic mathematical operations.

## Functions

### `calculate`
Performs basic mathematical calculations (add, subtract, multiply, divide).

**Parameters:**
- `operation` (string, required): Mathematical operation: add, subtract, multiply, divide
- `a` (number, required): First number
- `b` (number, required): Second number

**Returns:**
- Object with operation, result, and formatted string

### `calculateExpression`
Calculates a mathematical expression string.

**Parameters:**
- `expression` (string, required): Mathematical expression to evaluate (e.g., "2 + 3 * 4")

**Returns:**
- Object with expression, result, and formatted string

## Dependencies
None

## Usage Example
```typescript
import { calculate, calculateExpression } from './calculator';

// Basic calculation
const result1 = await calculate.execute({
  operation: 'add',
  a: 5,
  b: 3
});
// Returns: { operation: "5 add 3", result: 8, formatted: "5 add 3 = 8" }

// Expression calculation
const result2 = await calculateExpression.execute({
  expression: "2 + 3 * 4"
});
// Returns: { expression: "2 + 3 * 4", result: 14, formatted: "2 + 3 * 4 = 14" }
```