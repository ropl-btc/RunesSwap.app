#!/bin/bash

# Pre-commit hook for Claude Code
# This script runs before git commit commands to validate code quality

# Parse the command from stdin (Claude Code passes the command details as JSON)
COMMAND_INPUT=$(cat)

# Extract the command from the JSON input
COMMAND=$(echo "$COMMAND_INPUT" | grep -o '"command":"[^"]*"' | cut -d'"' -f4)

# Check if this is a git commit command
if [[ "$COMMAND" == *"git commit"* ]]; then
    echo "🔍 Running pre-commit checks..."
    
    # Change to project directory
    cd "$CLAUDE_PROJECT_DIR" || exit 1
    
    # Run linting
    echo "📝 Running linter..."
    if ! pnpm lint --fix; then
        echo "❌ Linting failed. Please fix the issues before committing."
        exit 1
    fi
    
    # Run type checking
    echo "🔍 Running type checks..."
    if ! pnpm type-check; then
        echo "❌ Type checking failed. Please fix type errors before committing."
        exit 1
    fi
    
    # Run tests
    echo "🧪 Running tests..."
    if ! pnpm test; then
        echo "❌ Tests failed. Please fix failing tests before committing."
        exit 1
    fi
    
    # Run AI check (if configured in package.json)
    if grep -q "ai-check" package.json; then
        echo "🤖 Running AI checks..."
        if ! pnpm ai-check; then
            echo "❌ AI checks failed. Please review the issues before committing."
            exit 1
        fi
    fi
    
    echo "✅ All pre-commit checks passed!"
fi

# Allow the command to proceed
exit 0