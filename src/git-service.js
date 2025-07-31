// Git operations and GitHub API interactions
import { execSync } from "child_process";
import * as github from "@actions/github";
import { DEFAULT_CONFIG } from "../defaults.js";

export class GitService {
  constructor(octokit) {
    this.octokit = octokit;
  }

  // Get current branch name
  getCurrentBranch() {
    try {
      return execSync("git branch --show-current", { encoding: "utf8" }).trim();
    } catch (error) {
      console.warn("Failed to get current branch:", error.message);
      return "";
    }
  }

  // Get PR title
  getPRTitle() {
    if (github.context.payload.pull_request) {
      return github.context.payload.pull_request.title || "";
    }
    
    // Fallback to last commit message for local execution
    try {
      return execSync("git log -1 --pretty=%s", { encoding: "utf8" }).trim();
    } catch (error) {
      console.warn("PR 제목을 가져올 수 없습니다:", error.message);
      return "";
    }
  }

  // Get commit messages from local Git
  getCommitMessagesFromLocalGit() {
    try {
      const mainBranch = DEFAULT_CONFIG.mainBranch;
      const currentBranch = this.getCurrentBranch();
      
      const ancestor = execSync(`git merge-base ${mainBranch} ${currentBranch}`, {
        encoding: "utf8"
      }).trim();
      
      return execSync(`git log ${ancestor}..${currentBranch} --pretty=%B`, {
        encoding: "utf8",
      }).trim();
    } catch (error) {
      console.warn("로컬 Git에서 커밋 메시지를 가져오는 데 실패했습니다:", error.message);
      // Fallback: get only last commit message
      return execSync("git log -1 --pretty=%B", { encoding: "utf8" }).trim();
    }
  }

  // Get commit messages (GitHub API or local Git)
  async getCommitMessages() {
    if (this.octokit && github.context.payload.pull_request) {
      try {
        console.log("GitHub API를 통해 PR의 커밋 목록을 가져옵니다.");
        const { owner, repo } = github.context.repo;
        const pull_number = github.context.payload.pull_request.number;

        const commits = await this.octokit.paginate(
          this.octokit.rest.pulls.listCommits,
          { owner, repo, pull_number }
        );

        return commits.map((commit) => commit.commit.message).join("\n");
      } catch (error) {
        console.warn("GitHub API 호출 실패, 로컬 Git으로 대체합니다:", error.message);
        return this.getCommitMessagesFromLocalGit();
      }
    } else {
      console.log("로컬 Git에서 커밋 메시지를 가져옵니다.");
      return this.getCommitMessagesFromLocalGit();
    }
  }

  // Get Git diff from GitHub API
  async getGitDiffFromGitHub() {
    const { owner, repo } = github.context.repo;
    const pull_number = github.context.payload.pull_request.number;

    const files = await this.octokit.paginate(
      this.octokit.rest.pulls.listFiles,
      { owner, repo, pull_number }
    );

    const changedFiles = files
      .filter((file) => file.status !== "removed")
      .map((file) => file.filename);

    // Convert to unified diff format
    let diff = "";
    for (const file of files) {
      if (file.patch) {
        diff += `diff --git a/${file.filename} b/${file.filename}\n`;
        diff += `index ${file.sha}..${file.sha} 100644\n`;
        diff += `--- a/${file.filename}\n`;
        diff += `+++ b/${file.filename}\n`;
        diff += file.patch + "\n";
      }
    }

    console.log(`GitHub API로 ${files.length}개 파일의 변경사항을 가져왔습니다.`);
    return { diff, changedFiles };
  }

  // Get Git diff from local Git
  getGitDiffFromLocal() {
    try {
      let diffCommand, nameOnlyCommand;

      if (github.context.payload.pull_request) {
        const baseSha = github.context.payload.pull_request.base.sha;
        const headSha = github.context.payload.pull_request.head.sha;
        diffCommand = `git diff ${baseSha}..${headSha}`;
        nameOnlyCommand = `git diff --name-only ${baseSha}..${headSha}`;
        console.log(`로컬 Git PR diff: ${baseSha}..${headSha}`);
      } else {
        diffCommand = "git diff HEAD~1..HEAD";
        nameOnlyCommand = "git diff --name-only HEAD~1..HEAD";
        console.log("로컬 Git diff: HEAD~1..HEAD");
      }

      const diff = execSync(diffCommand, { encoding: "utf8" });
      const changedFiles = execSync(nameOnlyCommand, { encoding: "utf8" })
        .split("\n")
        .filter((file) => file.trim());

      return { diff, changedFiles };
    } catch (error) {
      console.error("로컬 Git diff 분석 실패:", error.message);
      return { diff: "", changedFiles: [] };
    }
  }

  // Get Git diff (GitHub API first, local Git fallback)
  async getGitDiff() {
    if (this.octokit && github.context.payload.pull_request) {
      try {
        console.log("GitHub API를 통해 PR diff를 가져옵니다.");
        return await this.getGitDiffFromGitHub();
      } catch (error) {
        console.warn("GitHub API로 diff 가져오기 실패, 로컬 Git으로 대체:", error.message);
        return this.getGitDiffFromLocal();
      }
    } else {
      console.log("로컬 Git에서 diff를 가져옵니다.");
      return this.getGitDiffFromLocal();
    }
  }
}