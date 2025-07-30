# AI PR Template Generator

[![GitHub release](https://img.shields.io/github/release/seob717/ai-pr-template-action.svg)](https://github.com/seob717/ai-pr-template-action/releases)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-ai--pr--template--generator-blue?logo=github)](https://github.com/marketplace/actions/ai-pr-template-generator)

Automatically generate and fill PR templates using multiple AI providers based on git diff analysis. This action analyzes your code changes and intelligently fills out PR template sections, saving time and ensuring consistent PR documentation.

**🆓 Free tier support for multiple AI providers!**

## 🔒 **Security & Privacy for Enterprise Use**

⚠️ **Important**: When using this action with proprietary code, consider data privacy policies:

### 🏢 **Enterprise-Safe Options** (Code NOT used for training):

- **✅ Google Vertex AI** - Enterprise-grade, GDPR compliant, data stays in your region
- **✅ Claude Pro (Anthropic)** - Explicit no-training policy
- **✅ OpenAI Enterprise** - Business tier with data protection

### ⚠️ **Caution Required** (May use data for training):

- **🔶 OpenAI Free/Standard** - May use data for model improvement
- **🔶 Google AI Studio (Free)** - May use data for quality improvement
- **🔶 Groq/Hugging Face** - Check their data policies

### 🛡️ **Recommendation for Corporate Use**:

Use **Vertex AI with gemini-1.5-pro** for the best balance of security, performance, and cost.

## ✨ Features

- **🤖 Multiple AI Providers**: Support for Claude, OpenAI, Google Gemini, Vertex AI, Groq, and Hugging Face
- **🆓 Free Tier Support**: Use free models like GPT-4o-mini, Gemini Flash, Llama 3.1, etc.
- **📋 Smart Template Selection**: Automatically selects appropriate templates based on branch names or commit messages
- **🎯 Customizable Templates**: Support for multiple PR template types (feature, hotfix, release, bugfix)
- **⚡ Zero Configuration**: Works out of the box with sensible defaults
- **🔧 Highly Configurable**: Customize AI providers, models, template paths, and more
- **🧩 Advanced Customization**: Use `pr-rules.json` to extract information like Jira tickets and `pr-system-prompt.md` to customize AI behavior.

## 🚀 Quick Start

### 1. Create a PR Template

Create a template file like `.github/pull_request_templates/feature.md`:

```markdown
## 🎯 What does this PR do?

<!-- AI will fill this automatically -->

## 🔄 Changes Made

<!-- AI will fill this automatically -->

## Jira Tickets

-

## 📝 Notes for Reviewers

<!-- AI will fill this automatically -->
```

### 2. Set up the Workflow

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
        # No fetch-depth needed - uses GitHub API for both commits and diff

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

### 3. Add API Key

Go to your chosen provider's website (e.g., [Groq Console](https://console.groq.com/keys)), get your API key, and add it as a repository secret (e.g., `GROQ_API_KEY`).

---

## 🛠️ Advanced Customization

### Customizing the AI Prompt

You can define your own system prompt to guide the AI's behavior. Create a `.github/pr-system-prompt.md` file:

**Example `.github/pr-system-prompt.md`:**

```markdown
You are a senior software engineer at our company. Your task is to write a Pull Request description based on the provided git diff.

**Style Guide:**

- Write in clear, formal Korean.
- Summarize the core changes first.
- List technical details in bullet points.
- Always include a "Testing Notes" section.
```

If this file exists, it will be used as the system prompt. Otherwise, a default prompt will be used.

### Extracting Information with Rules

To automatically extract and place information like Jira tickets, create a `.github/pr-rules.json` file:

**Example `.github/pr-rules.json`:**

```json
{
  "rules": [
    {
      "pattern": "(DD-\\d+)",
      "targetSection": "## Jira Tickets"
    }
  ]
}
```

- `pattern`: A regex to find information in commit messages or branch names.
- `targetSection`: The Markdown header in your template where the extracted info should be placed.

## 📖 Usage

### 🏢 **Enterprise Usage** (Vertex AI - Recommended)

```yaml
- name: Generate AI PR Template
  uses: seob717/ai-pr-template-action@main
  with:
    ai-provider: "vertex-ai"
    api-key: ${{ secrets.VERTEX_AI_API_KEY }}
    project-id: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
    model: "gemini-1.5-pro"
    location: "asia-northeast3" # Seoul region
```

### 🆓 **Free Usage Options**

#### Groq (Fast & Free):

```yaml
- name: Generate AI PR Template
  uses: seob717/ai-pr-template-action@main
  with:
    ai-provider: "groq"
    api-key: ${{ secrets.GROQ_API_KEY }}
    model: "llama-3.1-70b-versatile"
```

#### OpenAI:

```yaml
- name: Generate AI PR Template
  uses: seob717/ai-pr-template-action@main
  with:
    ai-provider: "openai"
    api-key: ${{ secrets.OPENAI_API_KEY }}
    model: "gpt-4o-mini"
```

#### Google Gemini (Free tier):

```yaml
- name: Generate AI PR Template
  uses: seob717/ai-pr-template-action@main
  with:
    ai-provider: "google"
    api-key: ${{ secrets.GOOGLE_API_KEY }}
    model: "gemini-1.5-flash"
```

### 🔧 **Advanced Configuration**

```yaml
- name: Generate AI PR Template
  uses: seob717/ai-pr-template-action@main
  with:
    ai-provider: "vertex-ai"
    api-key: ${{ secrets.VERTEX_AI_API_KEY }}
    project-id: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
    model: "gemini-1.5-pro"
    location: "us-central1"
    template-path: "docs/pr_templates" # Custom template path
    default-template: "enhancement" # Custom default template
```

## ⚙️ Configuration

### Inputs

| Input              | Description                                                    | Required | Default                          |
| ------------------ | -------------------------------------------------------------- | -------- | -------------------------------- |
| `ai-provider`      | AI provider: `claude`, `openai`, `google`, `vertex-ai`, `groq` | ❌       | `claude`                         |
| `api-key`          | API key for the selected AI provider                           | ✅       | -                                |
| `project-id`       | Google Cloud Project ID (required for Vertex AI)               | ❌       | -                                |
| `location`         | Google Cloud region (for Vertex AI)                            | ❌       | `us-central1`                    |
| `model`            | Specific model to use                                          | ❌       | Provider default                 |
| `template-path`    | Path to PR templates directory                                 | ❌       | `.github/pull_request_templates` |
| `default-template` | Default template when auto-selection fails                     | ❌       | `feature`                        |
| `github-token`     | GitHub token for API requests and PR updates                   | ✅       | `${{ secrets.GITHUB_TOKEN }}`    |

### Legacy Inputs (Deprecated)

| Input               | Description           | Status        |
| ------------------- | --------------------- | ------------- |
| `anthropic-api-key` | Use `api-key` instead | ⚠️ Deprecated |
| `openai-api-key`    | Use `api-key` instead | ⚠️ Deprecated |
| `google-api-key`    | Use `api-key` instead | ⚠️ Deprecated |

### Outputs

| Output              | Description                                   |
| ------------------- | --------------------------------------------- |
| `template-used`     | The template that was selected and used       |
| `content-generated` | Whether AI content was successfully generated |

## 🎯 Template Selection Logic

The action automatically selects templates based on:

### Branch Name Patterns

- `feature/`, `feat/` → `feature.md`
- `hotfix/` → `hotfix.md`
- `release/` → `release.md`
- `bugfix/`, `bug/` → `bugfix.md`

### Commit Message Prefixes

- `feat:`, `feature:` → `feature.md`
- `fix:`, `hotfix:` → `hotfix.md` or `bugfix.md`
- `release:` → `release.md`

### Fallback

- Uses `default-template` if no pattern matches

## 📝 Template Structure

Templates should include sections that the AI can automatically fill:

```markdown
## Changes Made

<!-- AI fills based on git diff analysis -->

## Key Points

<!-- AI highlights important changes -->

## Testing Notes

<!-- AI suggests testing approaches -->

## Review Focus

<!-- AI identifies areas needing attention -->
```

## 🎨 Example Templates

### Feature Template

```markdown
## 🎯 Feature Description

<!-- Brief description of the new feature -->

## 🔄 Changes Made

- <!-- AI-generated list of changes -->

## 🧪 Testing

- [ ] Unit tests added
- [ ] Integration tests updated
- [ ] Manual testing completed

## 📝 Notes for Reviewers

<!-- AI-generated reviewer guidance -->
```

### Hotfix Template

```markdown
## 🚨 Issue Description

<!-- Description of the bug being fixed -->

## 🔧 Fix Applied

<!-- AI-generated description of the fix -->

## ⏰ Urgency

- [ ] Critical production issue
- [ ] Affects user experience
- [ ] Security vulnerability

## 🧪 Verification

<!-- AI-generated testing suggestions -->
```

## 🔧 Development

### Local Testing

```bash
# Clone the repository
git clone https://github.com/seob717/ai-pr-template-action
cd ai-pr-template-action

# Install dependencies
npm install @anthropic-ai/sdk

# Set environment variables
export ANTHROPIC_API_KEY="your-api-key"

# Run locally
node pr-template-generator.js
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📚 [Documentation](https://github.com/seob717/ai-pr-template-action/wiki)
- 🐛 [Report Issues](https://github.com/seob717/ai-pr-template-action/issues)
- 💬 [Discussions](https://github.com/seob717/ai-pr-template-action/discussions)

## 🌟 **Available AI Models**

### Enterprise Models (High Quality):

- **Vertex AI**: `gemini-1.5-pro`, `gemini-1.5-flash`
- **Claude**: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`

### Free Models:

- **Groq**: `llama-3.1-70b-versatile`, `llama-3.1-8b-instant`
- **Google**: `gemini-1.5-flash`
- **OpenAI**: `gpt-4o-mini` (limited free tier)

### Supported Regions (Vertex AI):

- `us-central1` (Iowa)
- `us-east1` (South Carolina)
- `us-west1` (Oregon)
- `europe-west1` (Belgium)
- `asia-northeast1` (Tokyo)
- `asia-northeast3` (Seoul) 🇰🇷
- `asia-southeast1` (Singapore)

## 🚀 **Complete Example**

`.github/workflows/ai-pr-template.yml`:

```yaml
name: AI PR Template Generator

on:
  pull_request:
    types: [opened, synchronize, edited]

jobs:
  generate-pr-template:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        # Default fetch-depth: 1 is sufficient - uses GitHub API for diff

      - name: Generate AI PR Template
        id: ai-pr-template
        uses: seob717/ai-pr-template-action@main
        with:
          # Enterprise setup (secure for corporate code)
          ai-provider: "vertex-ai"
          api-key: ${{ secrets.VERTEX_AI_API_KEY }}
          project-id: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
          model: "gemini-1.5-pro"
          location: "asia-northeast3" # Seoul
          github-token: ${{ secrets.GITHUB_TOKEN }}

          # Optional customization
          template-path: ".github/pull_request_templates"
          default-template: "feature"

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

---

**Made with ❤️ and AI by [seob717](https://github.com/seob717)**
