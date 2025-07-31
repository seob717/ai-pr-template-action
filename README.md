# AI PR Template Generator

[![GitHub release](https://img.shields.io/github/release/seob717/ai-pr-template-action.svg)](https://github.com/seob717/ai-pr-template-action/releases)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-ai--pr--template--generator-blue?logo=github)](https://github.com/marketplace/actions/ai-pr-template-generator)

Automatically generate and fill PR templates using AI. Analyzes your code changes and intelligently fills out PR template sections, saving time and ensuring consistent documentation.

## ✨ Features

- **🤖 Multiple AI Providers** - Claude, OpenAI, Google Gemini, Vertex AI, Groq, Hugging Face
- **🆓 Free Options Available** - GPT-4o-mini, Gemini Flash, Llama 3.1, and more
- **📋 Smart Template Selection** - Auto-selects templates based on branch names or commits
- **⚡ Zero Configuration** - Works out of the box with sensible defaults
- **🔧 Highly Customizable** - Configure AI providers, models, templates, and extraction rules

## 🔒 Enterprise Security

**For proprietary code, choose providers that don't use your data for training:**

✅ **Recommended:** Vertex AI, Claude Pro, OpenAI Enterprise  
⚠️ **Check policies:** OpenAI Free, Google AI Studio Free, Groq

## 🚀 Quick Start

### 1. Create a PR Template

Create `.github/pull_request_templates/feature.md`:

```markdown
## 🎯 What does this PR do?

<!-- AI will fill this automatically -->

## 🔄 Changes Made

<!-- AI will fill this automatically -->

## 🧪 Testing

- [ ] Tests added/updated
- [ ] Manual testing completed

## 📝 Review Notes

<!-- AI will fill this automatically -->
```

### 2. Add GitHub Workflow

Create `.github/workflows/ai-pr-template.yml`:

```yaml
name: AI PR Template

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  generate-template:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate AI PR Template
        id: ai-pr-template
        uses: seob717/ai-pr-template-action@v1
        with:
          ai-provider: "groq"
          api-key: ${{ secrets.GROQ_API_KEY }}
          model: "llama-3.1-70b-versatile"
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Update PR Body
        if: steps.ai-pr-template.outputs.content-generated == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const prBody = fs.readFileSync('pr-template-output.md', 'utf8');
            
            await github.rest.pulls.update({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.pull_request.number,
              body: prBody
            });
```

### 3. Get Free API Key

1. Go to [Groq Console](https://console.groq.com/keys) (free!)
2. Create an API key
3. Add it as `GROQ_API_KEY` in your repository secrets

That's it! Open a PR and watch the AI fill your template automatically! 🎉

## 📖 Usage Examples

### Free Providers

```yaml
# Groq (Fast & Free)
ai-provider: "groq"
model: "llama-3.1-70b-versatile"

# Google Gemini (Free tier)
ai-provider: "google" 
model: "gemini-1.5-flash"

# OpenAI (Limited free tier)
ai-provider: "openai"
model: "gpt-4o-mini"
```

### Enterprise Providers

```yaml
# Vertex AI (Enterprise security)
ai-provider: "vertex-ai"
api-key: ${{ secrets.VERTEX_AI_API_KEY }}
project-id: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
model: "gemini-1.5-pro"

# Claude (No training policy)
ai-provider: "claude"
model: "claude-3-5-sonnet-20241022"
```

## ⚙️ Configuration

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `ai-provider` | AI provider (`claude`, `openai`, `google`, `vertex-ai`, `groq`) | ❌ | `claude` |
| `api-key` | API key for the selected provider | ✅ | - |
| `model` | Specific model name | ❌ | Provider default |
| `template-path` | Path to templates directory | ❌ | `.github/pull_request_templates` |
| `github-token` | GitHub token for PR updates | ✅ | `${{ secrets.GITHUB_TOKEN }}` |

### Outputs

| Output | Description |
|--------|-------------|
| `template-used` | Template that was selected |  
| `content-generated` | Whether AI content was generated |

## 🛠️ Advanced Features

### Extract Jira Tickets

Create `.github/pr-rules.json`:

```json
{
  "rules": [
    {
      "pattern": "(PROJ-\\d+)",
      "targetSection": "## Jira Tickets"
    }
  ]
}
```

### Custom AI Instructions

Create `.github/pr-system-prompt.md`:

```markdown
You are a senior developer. Write clear, concise PR descriptions focusing on:
- What changed and why
- Potential impacts  
- What reviewers should focus on
```

### Template Selection

The action automatically selects templates based on:
- Branch names: `feature/`, `hotfix/`, `bugfix/`
- Commit messages: `feat:`, `fix:`, `hotfix:`

## 📚 Documentation

- 📖 [Getting Started Guide](GETTING_STARTED.md) - 5-minute setup
- 📚 [Best Practices Guide](BEST_PRACTICES.md) - Advanced configuration
- 🐛 [Report Issues](https://github.com/seob717/ai-pr-template-action/issues)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Created by [seob717](https://github.com/seob717)**