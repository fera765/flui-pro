# Text Utils Plugin

## Description
A text utilities plugin for Flui that provides various text manipulation functions.

## Functions

### `reverseText`
Reverses the order of characters in a text string.

**Parameters:**
- `text` (string, required): Text to reverse

**Returns:**
- Object with original text, reversed text, and length

### `countWords`
Counts words, characters, and lines in a text.

**Parameters:**
- `text` (string, required): Text to analyze

**Returns:**
- Object with word count, character count, line count, and average word length

### `textToUppercase`
Converts text to different cases (uppercase, lowercase, title case).

**Parameters:**
- `text` (string, required): Text to convert

**Returns:**
- Object with original text and converted versions

## Dependencies
None

## Usage Example
```typescript
import { reverseText, countWords, textToUppercase } from './text-utils';

// Reverse text
const result1 = await reverseText.execute({
  text: "Hello World"
});
// Returns: { original: "Hello World", reversed: "dlroW olleH", length: 11 }

// Count words
const result2 = await countWords.execute({
  text: "Hello world\nThis is a test"
});
// Returns: { wordCount: 5, characterCount: 22, lineCount: 2, ... }

// Convert case
const result3 = await textToUppercase.execute({
  text: "hello world"
});
// Returns: { original: "hello world", uppercase: "HELLO WORLD", lowercase: "hello world", titleCase: "Hello World" }
```