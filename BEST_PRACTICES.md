# 📚 Best Practices Guide

Advanced configuration and optimization tips for AI PR Template Generator.

## 📋 Table of Contents

- [Writing Effective System Prompts](#writing-effective-system-prompts)
- [Setting Up PR Rules](#setting-up-pr-rules)
- [Template Design](#template-design)
- [Workflow Optimization](#workflow-optimization)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Writing Effective System Prompts

### File Location
```
.github/pr-system-prompt.md
```

### ✨ Basic Prompt Structure

```markdown
You are a senior developer at [Company/Team Name].
Analyze the Git diff and fill out the PR template sections.

**Guidelines:**
- Write in clear, professional English
- Keep the markdown structure intact
- Replace only the AI placeholder comments
- Focus on what matters to reviewers

**Style:**
- Be concise and direct
- Use bullet points for lists
- Highlight important changes
- Mention potential risks or impacts
```

### 🎨 Customization Examples

**For Frontend Teams:**
```markdown
Focus on UI/UX changes, accessibility improvements, and browser compatibility.
Mention any visual changes and testing requirements.
```

**For Backend Teams:**
```markdown
Highlight API changes, database migrations, performance impacts, and security considerations.
```

**For DevOps Teams:**
```markdown
Emphasize infrastructure changes, deployment impacts, and monitoring requirements.
```

### 💡 Complete Example

```markdown
You are a senior software engineer reviewing code changes.

**Your Task:**
Analyze the Git diff and fill out PR template sections with helpful information for reviewers.

**Writing Style:**
- Clear and concise technical writing
- Use bullet points for easy scanning
- Highlight breaking changes or important updates
- Suggest specific review focus areas

**Section Guidelines:**

**Summary:** Brief overview of what this PR accomplishes
**Changes:** List key technical changes with file paths when relevant  
**Testing:** Mention test coverage and manual testing needs
**Review Notes:** Point out complex logic, potential risks, or areas needing extra attention

**Don't:**
- Add explanatory text like "The following changes were made..."
- Modify the template structure
- Leave placeholder comments in the final output
```

---

## 🔧 Setting Up PR Rules

### File Location
```
.github/pr-rules.json
```

### Basic Structure
```json
{
  "rules": [
    {
      "pattern": "regex_pattern_here",
      "targetSection": "## Target Section Header"
    }
  ]
}
```

### 🎯 Common Use Cases

#### Extract Jira Tickets
```json
{
  "rules": [
    {
      "pattern": "(PROJ-\\\\d+)",
      "targetSection": "## Jira Tickets"
    }
  ]
}
```

#### Multiple Ticket Systems
```json
{
  "rules": [
    {
      "pattern": "(ABC-\\\\d+|FEAT-\\\\d+|BUG-\\\\d+)",
      "targetSection": "## Related Tickets"
    }
  ]
}
```

#### GitHub Issues
```json
{
  "rules": [
    {
      "pattern": "#(\\\\d+)",
      "targetSection": "## Fixes"
    }
  ]
}
```

#### Multiple Rules Example
```json
{
  "rules": [
    {
      "pattern": "(PROJ-\\\\d+)",
      "targetSection": "## Jira Tickets"
    },
    {
      "pattern": "#(\\\\d+)",
      "targetSection": "## GitHub Issues"
    }
  ]
}
```

### 🔍 Regex Pattern Examples

| Purpose      | Pattern               | Matches           |
|-------------|----------------------|-------------------|
| Jira Ticket | `(PROJ-\\\\d+)`        | PROJ-123         |
| GitHub Issue| `#(\\\\d+)`            | #123             |
| Version Tag | `v(\\\\d+\\.\\\\d+\\.\\\\d+)`| v1.2.3           |
| Branch Type | `(feature\\|hotfix)/(\\\\w+)` | feature/login |
| Any Ticket  | `([A-Z]{2,}-\\\\d+)`   | ABC-123          |

---

## 📋 Template Design

### File Structure
```
.github/pull_request_templates/
├── feature.md
├── hotfix.md
├── release.md
└── bugfix.md
```

### ✨ Effective Template Structure

#### Simple Template
```markdown
## Summary

<!-- AI will fill this automatically -->

## Changes

<!-- AI will fill this automatically -->

## Testing

- [ ] Tests added/updated
- [ ] Manual testing completed

## Review Notes

<!-- AI will fill this automatically -->
```

#### Frontend-Focused Template
```markdown
## UI Changes

<!-- AI will fill this automatically -->

## Browser Testing

- [ ] Chrome
- [ ] Safari  
- [ ] Firefox
- [ ] Mobile browsers

## Accessibility

<!-- AI will fill this automatically -->

## Review Focus

<!-- AI will fill this automatically -->
```

#### Backend-Focused Template
```markdown
## API Changes

<!-- AI will fill this automatically -->

## Database Changes

<!-- AI will fill this automatically -->

## Security Considerations

<!-- AI will fill this automatically -->

## Performance Impact

<!-- AI will fill this automatically -->
```

---

## ⚙️ Workflow Optimization

### 🚀 Recommended Workflow

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
          ai-provider: "groq"  # Fast and free
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

### 🎯 Provider Recommendations

#### Free Usage (Personal/Startups)
```yaml
# Groq (fast and free)
ai-provider: 'groq'
model: 'llama-3.1-70b-versatile'

# Google Gemini (free tier)
ai-provider: 'google'
model: 'gemini-1.5-flash'
```

#### Enterprise Usage (Security-focused)
```yaml
# Vertex AI (enterprise security)
ai-provider: 'vertex-ai'
model: 'gemini-1.5-pro'
project-id: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
location: 'us-central1'

# Claude (data protection)
ai-provider: 'claude'
model: 'claude-3-5-sonnet-20241022'
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. AI Adds Unwanted Explanatory Text
**Problem:** AI adds "The following changes were made..." etc.
**Solution:** Update your system prompt:
```markdown
**Don't:**
- Add explanatory text like "The following changes were made..."
- Add meta-commentary about the changes
```

#### 2. Template Structure Gets Modified
**Problem:** AI changes headers or structure
**Solution:** Emphasize structure preservation:
```markdown
**Critical:** Keep the exact markdown structure. Only replace placeholder comments.
```

#### 3. Missing Jira Tickets
**Problem:** Tickets exist but aren't extracted
**Check:**
- Verify regex pattern in `pr-rules.json`
- Test regex with your actual commit messages
- Ensure tickets are in commit messages or branch names

#### 4. Poor AI Output Quality
**Solutions:**
- Try a different AI model (Groq llama-3.1-70b is often good)
- Improve your system prompt with specific examples
- Ensure your diff has meaningful changes

### Debugging Tips

#### Test Regex Patterns
```javascript
// Test in browser console
const pattern = /(PROJ-\d+)/g;
const text = "feat: PROJ-1234 add user login";
console.log(text.match(pattern)); // ["PROJ-1234"]
```

#### Enable Debug Logging
```yaml
- name: Generate AI PR Template
  uses: seob717/ai-pr-template-action@v1
  env:
    ACTIONS_STEP_DEBUG: true
```

#### Validate Templates
- Start with simple changes to test
- Add one rule at a time
- Check AI output consistency

---

## 🔗 Additional Resources

### Regex Testing Tools
- [Regex101](https://regex101.com/) - Detailed regex analysis
- [RegexPal](https://www.regexpal.com/) - Simple online tester

### AI Model Performance

For detailed model comparisons and benchmarks, see [Artificial Analysis](https://artificialanalysis.ai/models).

### Sample Configuration Files

Complete setup examples are available in the [examples/](examples/) folder.

---

**Need help? Check the [Getting Started Guide](GETTING_STARTED.md) or [open an issue](https://github.com/seob717/ai-pr-template-action/issues).**