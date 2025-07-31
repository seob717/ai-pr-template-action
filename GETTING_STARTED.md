# 🚀 Getting Started with AI PR Template Generator

Quick setup guide to start using AI-powered PR templates in 5 minutes.

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Your First Template

Create `.github/pull_request_templates/feature.md`:

```markdown
## 🎯 What does this PR do?

<!-- AI will fill this automatically -->

## 🔄 Changes Made

<!-- AI will fill this automatically -->

## 🧪 Testing

- [ ] Manual testing completed
- [ ] Tests pass

## 📝 Notes for Reviewers

<!-- AI will fill this automatically -->
```

### Step 2: Add GitHub Workflow

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

### Step 3: Get Free API Key

1. Go to [Groq Console](https://console.groq.com/keys)
2. Sign up (it's free!)
3. Create an API key
4. Add it as `GROQ_API_KEY` in your repository secrets:
   - Go to your repo → Settings → Secrets → Actions
   - Click "New repository secret"
   - Name: `GROQ_API_KEY`
   - Value: your API key

### Step 4: Test It

1. Create a new branch: `git checkout -b feature/test-ai-pr`
2. Make some changes and commit
3. Open a Pull Request
4. Watch the magic happen! 🎉

## 🎯 AI Provider Options

Choose the best option for your needs:

### 🆓 Free Options

**Groq (Recommended for most users)**
```yaml
ai-provider: "groq"
model: "llama-3.1-70b-versatile"  # Fast and smart
```

**Google Gemini**
```yaml
ai-provider: "google"
model: "gemini-1.5-flash"  # Good quality, free tier
```

**OpenAI**
```yaml
ai-provider: "openai"
model: "gpt-4o-mini"  # Small free tier
```

### 💼 Enterprise Options (Better Security)

**Vertex AI (Google Cloud)**
```yaml
ai-provider: "vertex-ai"
model: "gemini-1.5-pro"
project-id: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
location: "us-central1"
```

**Claude (Anthropic)**
```yaml
ai-provider: "claude"
model: "claude-3-5-sonnet-20241022"
```

## 📋 Template Examples

### Simple Feature Template
```markdown
## Summary

<!-- AI will fill this automatically -->

## Changes

<!-- AI will fill this automatically -->

## Testing

- [ ] Tests added
- [ ] Manual testing done

## Review Notes

<!-- AI will fill this automatically -->
```

### Bug Fix Template
```markdown
## 🐛 Bug Description

<!-- AI will fill this automatically -->

## 🔧 Fix

<!-- AI will fill this automatically -->

## ✅ Verification

<!-- AI will fill this automatically -->
```

## 🎨 Customization

### Extract Jira Tickets

Create `.github/pr-rules.json`:

```json
{
  "rules": [
    {
      "pattern": "(PROJ-\\d+)",
      "targetSection": "## Jira Ticket"
    }
  ]
}
```

### Custom AI Instructions

Create `.github/pr-system-prompt.md`:

```markdown
You are a senior developer reviewing code changes.

Write clear, concise descriptions focusing on:
- What changed and why
- Potential impacts
- What reviewers should focus on

Keep it simple and direct.
```

## 🔧 Common Issues

**AI says "No changes detected"**
- Make sure you have actual code changes in your PR
- Check that the action has access to see the diff

**Wrong template selected**
- Check your branch naming (feature/, hotfix/, etc.)
- Or add custom template selection rules

**Template not updating**
- Verify your GitHub token has `pull-requests: write` permission
- Check the action logs for errors

## 🆘 Need Help?

- 📚 See [Best Practices Guide](BEST_PRACTICES.md) for advanced setup
- 🐛 [Report issues](https://github.com/seob717/ai-pr-template-action/issues)
- 💬 [Ask questions](https://github.com/seob717/ai-pr-template-action/discussions)

---

**Ready to try it? Create your first PR and see the AI in action! 🚀**