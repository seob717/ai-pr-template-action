// Default configuration and templates for AI PR Writer

export const DEFAULT_PATHS = {
  templateDir: ".github/ai-pr/templates",
  rulesPath: ".github/ai-pr/rules.json", 
  systemPromptPath: ".github/ai-pr/prompt.md"
};

export const DEFAULT_CONFIG = {
  aiProvider: "claude",
  defaultTemplate: "feature",
  updateMode: "create-only",
  mainBranch: "main",
  maxTokens: 1000,
  temperature: 0.7,
  location: "us-central1"
};

export const DEFAULT_MODELS = {
  claude: "claude-3-5-sonnet-20241022",
  openai: "gpt-4o",
  google: "gemini-1.5-flash", 
  "vertex-ai": "gemini-1.5-pro",
  groq: "llama-3.1-70b-versatile",
  huggingface: "microsoft/DialoGPT-medium"
};

export const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant that analyzes Git diffs and fills out Pull Request templates automatically.

**Writing Guidelines:**
- Write in clear, concise English
- Keep markdown structure intact
- Replace only \`<!-- AI will fill this automatically -->\` placeholders
- Leave empty sections as-is if no relevant information is found
- Focus on what changed, why it matters, and what reviewers should know

**Writing Style:**
- Be direct and technical
- Use bullet points for lists
- Highlight important changes or potential impacts
- Suggest specific areas for reviewer attention`;

export const DEFAULT_TEMPLATES = {
  feature: `## 🎯 What does this PR do?

<!-- AI will fill this automatically -->

## 🔄 Changes Made

<!-- AI will fill this automatically -->

## 🧪 Testing

- [ ] Tests added/updated
- [ ] Manual testing completed

## 📝 Review Notes

<!-- AI will fill this automatically -->`,

  hotfix: `## 🚨 What's the issue?

<!-- AI will fill this automatically -->

## 🔧 How is it fixed?

<!-- AI will fill this automatically -->

## ⏰ Urgency Level

- [ ] Critical production issue
- [ ] Affects user experience  
- [ ] Security vulnerability
- [ ] Minor issue

## 🧪 How to verify the fix

<!-- AI will fill this automatically -->

## 🔗 Related Issues

- Fixes #`,

  bugfix: `## 🐛 Bug Description

<!-- AI will fill this automatically -->

## 🔧 Fix Applied

<!-- AI will fill this automatically -->

## ✅ Testing

- [ ] Bug reproduction confirmed
- [ ] Fix tested locally
- [ ] Regression tests added

## 📝 Review Notes

<!-- AI will fill this automatically -->`,

  release: `## 🚀 Release Summary

<!-- AI will fill this automatically -->

## 📋 Changes in this Release

<!-- AI will fill this automatically -->

## 🧪 Testing Checklist

- [ ] All tests pass
- [ ] Manual QA completed
- [ ] Performance verified

## 📝 Release Notes

<!-- AI will fill this automatically -->`,

  default: `## Summary

<!-- AI will fill this automatically -->

## Changes

<!-- AI will fill this automatically -->

## Testing

<!-- AI will fill this automatically -->

## Review Notes

<!-- AI will fill this automatically -->`
};

export const DEFAULT_RULES = {
  rules: [],
  templateSelection: {
    rules: [],
    defaultTemplate: "feature"
  }
};

// Template selection patterns
export const DEFAULT_TEMPLATE_PATTERNS = {
  hotfix: ["hotfix"],
  release: ["release"], 
  feature: ["feature", "feat"],
  bugfix: ["bugfix", "bug", "fix"]
};

export const DEFAULT_COMMIT_PATTERNS = {
  hotfix: ["hotfix"],
  feature: ["feat", "feature"],
  bugfix: ["fix"],
  release: ["release"]
};

export const OUTPUT_FILENAME = "pr-template-output.md";

export const ERROR_MESSAGES = {
  noChanges: "No changes detected.",
  noApiKey: "⚠️ No API key found. Will use basic template without AI generation.",
  aiGenerationFailed: "⚠️ AI generation failed, using basic template only.",
  templateSelectionFailed: "Template selection failed:",
  ruleLoadFailed: "Rule file loading or parsing failed:",
  gitDiffFailed: "Local Git diff analysis failed:",
  vertexAiProjectIdRequired: "PROJECT_ID environment variable is required for Vertex AI"
};

export const SUCCESS_MESSAGES = {
  generationStarted: "🤖 AI PR Writer starting...",
  templateSelected: "📋 Selected template:",
  aiGenerating: "🧠 Generating content with AI...",
  generationComplete: "✅ PR template generation complete",
  githubApiSuccess: "Getting PR diff via GitHub API.",
  localGitFallback: "Getting diff from local Git."
};