#!/bin/bash
set -euo pipefail

# Pre-commit hook for Claude Code
# This script runs before git commit commands to validate code quality

# Parse the command from stdin (Claude Code passes the command details as JSON)
COMMAND_INPUT=$(cat)

# Extract the command from the JSON input (robust JSON parsing)
COMMAND=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log(j.command||"")}catch{console.log("")}})' <<< "$COMMAND_INPUT")

# Check if this is a git commit command
if [[ "$COMMAND" == *"git commit"* ]]; then
    echo "🔍 Running pre-commit checks..."
    
    # Change to project directory
    if [[ -n "${CLAUDE_PROJECT_DIR:-}" ]]; then
        cd "$CLAUDE_PROJECT_DIR" || { echo "❌ Could not cd to CLAUDE_PROJECT_DIR"; exit 1; }
    else
        REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
        echo "ℹ️ CLAUDE_PROJECT_DIR not set; using repo root: $REPO_ROOT"
        cd "$REPO_ROOT" || { echo "❌ Could not cd to repo root"; exit 1; }
    fi
    
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
    
    # Run AI check (if configured in package.json scripts)
    if node -e 'const p=require("./package.json");process.exit(p.scripts&&p.scripts["ai-check"]?0:1)'; then
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