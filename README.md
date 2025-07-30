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

## 🚀 Quick Start

### 1. Create PR Templates

Create your PR templates in `.github/pull_request_templates/`:

```
.github/
└── pull_request_templates/
    ├── feature.md
    ├── hotfix.md
    ├── release.md
    └── bugfix.md
```

Example `feature.md`:
```markdown
## 🎯 What does this PR do?

<!-- AI will fill this automatically -->

## 🔄 Changes Made

<!-- AI will fill this automatically -->

## 🧪 Testing

<!-- AI will fill this automatically -->

## 📝 Notes for Reviewers

<!-- AI will fill this automatically -->
```

### 2. Set up the Workflow

Create `.github/workflows/ai-pr-template.yml`:

#### 🏢 **Enterprise Setup** (Recommended for Corporate Use)

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
        with:
          fetch-depth: 2
          
      # Enterprise-grade Vertex AI (Secure & High Performance)
      - name: Generate AI PR Template
        uses: seob717/ai-pr-template-action@v1
        with:
          ai-provider: 'vertex-ai'
          api-key: ${{ secrets.VERTEX_AI_API_KEY }}
          project-id: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
          model: 'gemini-1.5-pro'  # High performance model
          location: 'us-central1'  # Or your preferred region
```

#### 🆓 **Free Tier Setup**

```yaml
      # Using Groq (Free Llama 3.1)
      - name: Generate AI PR Template
        uses: seob717/ai-pr-template-action@v1
        with:
          ai-provider: 'groq'
          api-key: ${{ secrets.GROQ_API_KEY }}
          model: 'llama-3.1-70b-versatile'  # High performance free model
          
      # Or using Google Gemini (Free tier)
      # - name: Generate AI PR Template
      #   uses: seob717/ai-pr-template-action@v1
      #   with:
      #     ai-provider: 'google'
      #     api-key: ${{ secrets.GOOGLE_API_KEY }}
      #     model: 'gemini-1.5-flash'
```

### 3. Add API Key

Choose your preferred AI provider and add the API key:

#### 🏢 **Enterprise Options** (Secure for Corporate Code):
- **🥇 Google Vertex AI** - Get service account key at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
  - Add `VERTEX_AI_API_KEY` (service account JSON key)
  - Add `GOOGLE_CLOUD_PROJECT_ID` (your GCP project ID)
- **🥈 Claude Pro** - Get API key at [console.anthropic.com](https://console.anthropic.com)
- **🥉 OpenAI Enterprise** - Enterprise tier at [platform.openai.com](https://platform.openai.com)

#### 🆓 **Free Options** (Use caution with proprietary code):
- **Groq**: Fast Llama 3.1 - Get free API key at [console.groq.com](https://console.groq.com)
- **Google Gemini**: Free tier available - Get API key at [makersuite.google.com](https://makersuite.google.com)
- **OpenAI**: GPT-4o-mini has generous free tier - Get API key at [platform.openai.com](https://platform.openai.com)

## 📖 Usage

### Basic Usage

```yaml
- name: Generate AI PR Template
  uses: YOUR-USERNAME/ai-pr-template-action@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Usage

```yaml
- name: Generate AI PR Template
  uses: YOUR-USERNAME/ai-pr-template-action@v1
  with:
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    github-token: ${{ secrets.GITHUB_TOKEN }}
    template-path: 'docs/pr_templates'  # Custom template path
    default-template: 'enhancement'     # Custom default template
```

## ⚙️ Configuration

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `anthropic-api-key` | Anthropic API key for Claude | ✅ | - |
| `github-token` | GitHub token for PR operations | ✅ | `${{ github.token }}` |
| `template-path` | Path to PR templates directory | ❌ | `.github/pull_request_templates` |
| `default-template` | Default template when auto-selection fails | ❌ | `feature` |

### Outputs

| Output | Description |
|--------|-------------|
| `template-used` | The template that was selected and used |
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

## 🌟 Examples

Check out these example repositories using this action:
- [Example Repo 1](https://github.com/example/repo1)
- [Example Repo 2](https://github.com/example/repo2)

---

**Made with ❤️ and AI by [seob717](https://github.com/seob717)**