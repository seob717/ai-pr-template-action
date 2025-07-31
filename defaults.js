// Default configuration and templates for AI PR Template Generator

export const DEFAULT_PATHS = {
  // New structure paths (ai-pr folder)
  templateDir: ".github/ai-pr/templates",
  rulesPath: ".github/ai-pr/rules.json", 
  systemPromptPath: ".github/ai-pr/prompt.md",
  
  // Legacy paths (backward compatibility)
  legacyTemplateDir: ".github/pull_request_templates",
  legacyRulesPath: ".github/pr-rules.json",
  legacySystemPromptPath: ".github/pr-system-prompt.md"
};

export const DEFAULT_CONFIG = {
  aiProvider: "claude",
  defaultTemplate: "feature",
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

// Default template selection logic patterns
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

export const FALLBACK_PROMPT = "Please describe the changes based on the git diff.";

export const OUTPUT_FILENAME = "pr-template-output.md";

export const AI_GENERATION_CONFIG = {
  maxTokens: 1000,
  temperature: 0.7
};

export const ERROR_MESSAGES = {
  noChanges: "변경사항이 없습니다.",
  noApiKey: "⚠️ No API key found. Will use basic template without AI generation.",
  aiGenerationFailed: "⚠️ AI 생성 실패, 기본 템플릿만 사용합니다.",
  templateSelectionFailed: "템플릿 선택 실패:",
  ruleLoadFailed: "규칙 파일 로드 또는 파싱 실패:",
  gitDiffFailed: "로컬 Git diff 분석 실패:",
  vertexAiProjectIdRequired: "PROJECT_ID environment variable is required for Vertex AI"
};

export const SUCCESS_MESSAGES = {
  generationStarted: "🤖 AI PR Template Generator 시작...",
  templateSelected: "📋 선택된 템플릿:",
  aiGenerating: "🧠 AI로 내용 생성 중...",
  generationComplete: "✅ PR 템플릿 생성 완료",
  githubApiSuccess: "GitHub API를 통해 PR diff를 가져옵니다.",
  localGitFallback: "로컬 Git에서 diff를 가져옵니다."
};