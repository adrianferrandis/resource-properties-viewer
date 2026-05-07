# Contributing to Resource Properties Viewer

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/resource-properties-viewer.git`
3. Install dependencies: `npm install`
4. Build: `npm run build`

## Development Workflow

### Running in Development Mode

Use VSCode's extension development host to test changes:

1. Press `F5` in VSCode
2. This opens a new Extension Development Host window
3. Open any `.properties` file to test

### Running Tests

```bash
npm test
```

Tests are located in `src/test/suite/`.

### Code Style

- Use TypeScript with strict mode
- 2 spaces for indentation
- No semicolons at end of statements
- Prefer `const` over `let`
- Use explicit types, avoid `any`

## Project Structure

```
src/
├── extension.ts           # Entry point
├── providers/             # VSCode providers (custom editors, etc.)
├── services/              # Business logic (parser, serializer)
├── types/                 # TypeScript type definitions
└── test/
    └── suite/             # Test files
test/
├── fixtures/              # Test fixture files
└── sample/                # Sample .properties files for integration tests
```

## Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Commit with a clear message: `git commit -m "Add feature X"`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

## Testing Guidelines

- Unit tests should be in `src/test/suite/*.test.ts`
- Integration tests should be added to `src/test/suite/integration.test.ts`
- Use test fixtures in `test/fixtures/` for isolated testing
- Use `test/sample/` for multi-file integration tests

### Writing Tests

```typescript
import * as assert from 'assert';

// Use describe/it for test structure
describe('My Feature', () => {
  it('should do X', () => {
    assert.strictEqual(actual, expected);
  });
});
```

## Reporting Issues

- Use GitHub Issues
- Include VSCode version and extension version
- Provide reproduction steps
- Attach logs if relevant (enable debug logging in settings)

## Pull Request Process

1. Update documentation for any changed behavior
2. Add tests for new functionality
3. Follow the code style guidelines
4. Request review from maintainers
5. Address feedback promptly

## Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Reference issues: "Fix #123: ..."

## Questions?

Open an issue for discussion before starting significant work.