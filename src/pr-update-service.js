// PR update logic and GitHub Actions output handling
import fs from "fs";
import * as github from "@actions/github";

export class PRUpdateService {
  constructor(updateMode) {
    this.updateMode = updateMode;
  }

  // Determine if PR body should be updated
  shouldUpdatePRBody() {
    if (!github.context.payload.pull_request) {
      return false;
    }

    const prAction = github.context.payload.action;
    const currentBody = github.context.payload.pull_request.body || "";

    switch (this.updateMode) {
      case "always":
        return true;
      case "create-only":
        return prAction === "opened" || currentBody.trim() === "";
      case "comment-only":
        return false;
      default:
        return prAction === "opened" || currentBody.trim() === "";
    }
  }

  // Set GitHub Actions output
  setOutput(name, value) {
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
    } else {
      // Fallback for local testing
      console.log(`::set-output name=${name}::${value}`);
    }
  }

  // Create user prompt for AI  
  createUserPrompt(diff, changedFiles, template) {
    return `Analyze the following Git Diff and changed files list, then fill in each \`<!-- AI will fill this automatically -->\` section of the PR template according to the system prompt guidelines.

**Changed Files:**
\`\`\`
${changedFiles.join("\n")}
\`\`\`

**Git Diff:**
\`\`\`diff
${diff}
\`\`\`

**PR Template (Please fill in the placeholders in this template):**
${template}
`;
  }
}