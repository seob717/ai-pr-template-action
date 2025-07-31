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
    return `다음 Git Diff와 변경된 파일 목록을 분석하여, 시스템 프롬프트의 지침에 따라 PR 템플릿의 각 \`<!-- AI가 자동으로 채워줍니다 -->\` 섹션을 채워주세요.

**변경된 파일:**
\`\`\`
${changedFiles.join("\n")}
\`\`\`

**Git Diff:**
\`\`\`diff
${diff}
\`\`\`

**PR 템플릿 (이 템플릿의 플레이스홀더를 채워주세요):**
${template}
`;
  }
}