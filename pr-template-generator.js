#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import * as github from "@actions/github";
import {
  DEFAULT_PATHS,
  DEFAULT_CONFIG,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_TEMPLATES,
  DEFAULT_RULES,
  DEFAULT_TEMPLATE_PATTERNS,
  DEFAULT_COMMIT_PATTERNS,
  FALLBACK_PROMPT,
  OUTPUT_FILENAME,
  AI_GENERATION_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from "./defaults.js";

// AI Provider imports
let Anthropic, OpenAI, GoogleGenerativeAI, Groq;

// Dynamic imports based on provider
async function importAISDKs() {
  try {
    const anthropicModule = await import("@anthropic-ai/sdk");
    Anthropic = anthropicModule.Anthropic;
  } catch (e) {}

  try {
    const openaiModule = await import("openai");
    OpenAI = openaiModule.OpenAI;
  } catch (e) {}

  try {
    const googleModule = await import("@google/generative-ai");
    GoogleGenerativeAI = googleModule.GoogleGenerativeAI;
  } catch (e) {}

  try {
    const groqModule = await import("groq-sdk");
    Groq = groqModule.Groq;
  } catch (e) {}
}

class PRTemplateGenerator {
  constructor() {
    // Try new structure first, fallback to legacy
    this.templateDir = this.resolveTemplatePath();
    this.rulesPath = this.resolveRulesPath();
    this.systemPromptPath = this.resolveSystemPromptPath();
    this.aiProvider = process.env.AI_PROVIDER || DEFAULT_CONFIG.aiProvider;
    this.apiKey = this.getAPIKey();
    this.model = this.getModel();
    const rulesData = this.loadRules();
    this.rules = rulesData.rules || [];
    this.templateSelectionRules = rulesData.templateSelection || DEFAULT_RULES.templateSelection;

    this.githubToken = process.env.GITHUB_TOKEN;
    if (this.githubToken) {
      this.octokit = github.getOctokit(this.githubToken);
    }

    if (!this.apiKey) {
      console.log(ERROR_MESSAGES.noApiKey);
    }
  }

  // Path resolution methods (new structure first, legacy fallback)
  resolveTemplatePath() {
    if (process.env.TEMPLATE_PATH) {
      return path.join(process.cwd(), process.env.TEMPLATE_PATH);
    }
    
    const newPath = path.join(process.cwd(), DEFAULT_PATHS.templateDir);
    if (fs.existsSync(newPath)) {
      return newPath;
    }
    
    return path.join(process.cwd(), DEFAULT_PATHS.legacyTemplateDir);
  }

  resolveRulesPath() {
    const newPath = path.join(process.cwd(), DEFAULT_PATHS.rulesPath);
    if (fs.existsSync(newPath)) {
      return newPath;
    }
    
    return path.join(process.cwd(), DEFAULT_PATHS.legacyRulesPath);
  }

  resolveSystemPromptPath() {
    const newPath = path.join(process.cwd(), DEFAULT_PATHS.systemPromptPath);
    if (fs.existsSync(newPath)) {
      return newPath;
    }
    
    return path.join(process.cwd(), DEFAULT_PATHS.legacySystemPromptPath);
  }

  // API 키 가져오기 (우선순위: api-key > 개별 키)
  getAPIKey() {
    if (process.env.API_KEY) return process.env.API_KEY;

    switch (this.aiProvider) {
      case "claude":
        return process.env.ANTHROPIC_API_KEY;
      case "openai":
        return process.env.OPENAI_API_KEY;
      case "google":
        return process.env.GOOGLE_API_KEY;
      case "vertex-ai":
        return process.env.VERTEX_AI_API_KEY;
      case "groq":
        return process.env.GROQ_API_KEY;
      default:
        return process.env.ANTHROPIC_API_KEY;
    }
  }

  // 모델 선택
  getModel() {
    if (process.env.MODEL) return process.env.MODEL;
    return DEFAULT_MODELS[this.aiProvider] || DEFAULT_MODELS.claude;
  }

  // 시스템 프롬프트 로드
  loadSystemPrompt() {
    // 사용자 정의 프롬프트 시도
    if (fs.existsSync(this.systemPromptPath)) {
      try {
        return fs.readFileSync(this.systemPromptPath, "utf8");
      } catch (error) {
        console.error("시스템 프롬프트 파일 로드 실패:", error.message);
      }
    }
    
    // 기본 프롬프트 반환
    return DEFAULT_SYSTEM_PROMPT;
  }

  // 규칙 파일 로드
  loadRules() {
    if (fs.existsSync(this.rulesPath)) {
      try {
        const content = fs.readFileSync(this.rulesPath, "utf8");
        return JSON.parse(content);
      } catch (error) {
        console.error(ERROR_MESSAGES.ruleLoadFailed, error.message);
        return DEFAULT_RULES;
      }
    }
    return DEFAULT_RULES;
  }

  // 관련 Git 커밋 메시지 가져오기
  getCommitMessagesFromLocalGit() {
    try {
      const mainBranch = "main"; // 또는 'master'
      const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf8",
      }).trim();
      const ancestor = execSync(
        `git merge-base ${mainBranch} ${currentBranch}`,
        { encoding: "utf8" }
      ).trim();
      return execSync(`git log ${ancestor}..${currentBranch} --pretty=%B`, {
        encoding: "utf8",
      }).trim();
    } catch (error) {
      console.warn(
        "로컬 Git에서 커밋 메시지를 가져오는 데 실패했습니다:",
        error.message
      );
      // fallback: 마지막 커밋 메시지만 가져오기
      return execSync("git log -1 --pretty=%B", { encoding: "utf8" }).trim();
    }
  }

  // GitHub API 또는 로컬 Git을 통해 커밋 메시지 가져오기
  async getCommitMessages() {
    if (this.octokit && github.context.payload.pull_request) {
      try {
        console.log("GitHub API를 통해 PR의 커밋 목록을 가져옵니다.");
        const { owner, repo } = github.context.repo;
        const pull_number = github.context.payload.pull_request.number;

        const commits = await this.octokit.paginate(
          this.octokit.rest.pulls.listCommits,
          {
            owner,
            repo,
            pull_number,
          }
        );

        return commits.map((commit) => commit.commit.message).join("\n");
      } catch (error) {
        console.warn(
          "GitHub API 호출 실패, 로컬 Git으로 대체합니다:",
          error.message
        );
        return this.getCommitMessagesFromLocalGit();
      }
    } else {
      console.log("로컬 Git에서 커밋 메시지를 가져옵니다.");
      return this.getCommitMessagesFromLocalGit();
    }
  }

  // Git diff 분석 (GitHub API 우선, 로컬 Git 폴백)
  async getGitDiff() {
    // GitHub API를 통한 diff 가져오기 시도
    if (this.octokit && github.context.payload.pull_request) {
      try {
        console.log("GitHub API를 통해 PR diff를 가져옵니다.");
        const { owner, repo } = github.context.repo;
        const pull_number = github.context.payload.pull_request.number;

        // PR의 파일 목록과 변경사항 가져오기
        const files = await this.octokit.paginate(
          this.octokit.rest.pulls.listFiles,
          {
            owner,
            repo,
            pull_number,
          }
        );

        // 변경된 파일 목록 생성
        const changedFiles = files
          .filter((file) => file.status !== "removed")
          .map((file) => file.filename);

        // unified diff 형식으로 변환
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

        console.log(
          `GitHub API로 ${files.length}개 파일의 변경사항을 가져왔습니다.`
        );
        return { diff, changedFiles };
      } catch (error) {
        console.warn(
          "GitHub API로 diff 가져오기 실패, 로컬 Git으로 대체:",
          error.message
        );
        return this.getGitDiffFromLocal();
      }
    } else {
      console.log("로컬 Git에서 diff를 가져옵니다.");
      return this.getGitDiffFromLocal();
    }
  }

  // 로컬 Git을 통한 diff 가져오기 (폴백)
  getGitDiffFromLocal() {
    try {
      let diffCommand, nameOnlyCommand;

      // GitHub Actions PR 컨텍스트에서 정확한 diff 가져오기
      if (github.context.payload.pull_request) {
        const baseSha = github.context.payload.pull_request.base.sha;
        const headSha = github.context.payload.pull_request.head.sha;
        diffCommand = `git diff ${baseSha}..${headSha}`;
        nameOnlyCommand = `git diff --name-only ${baseSha}..${headSha}`;
        console.log(`로컬 Git PR diff: ${baseSha}..${headSha}`);
      } else {
        // 로컬 실행 시 폴백
        diffCommand = "git diff HEAD~1..HEAD";
        nameOnlyCommand = "git diff --name-only HEAD~1..HEAD";
        console.log("로컬 Git diff: HEAD~1..HEAD");
      }

      const diff = execSync(diffCommand, { encoding: "utf8" });
      const changedFiles = execSync(nameOnlyCommand, {
        encoding: "utf8",
      })
        .split("\n")
        .filter((file) => file.trim());

      return { diff, changedFiles };
    } catch (error) {
      console.error("로컬 Git diff 분석 실패:", error.message);
      return { diff: "", changedFiles: [] };
    }
  }

  // PR 제목 가져오기
  getPRTitle() {
    // GitHub Actions PR 컨텍스트에서 PR 제목 가져오기
    if (github.context.payload.pull_request) {
      return github.context.payload.pull_request.title || "";
    }
    
    // 로컬 실행 시 폴백 (첫 번째 커밋 메시지 활용)
    try {
      return execSync("git log -1 --pretty=%s", { encoding: "utf8" }).trim();
    } catch (error) {
      console.warn("PR 제목을 가져올 수 없습니다:", error.message);
      return "";
    }
  }

  // 규칙 기반 템플릿 선택
  selectTemplate() {
    try {
      // 규칙이 없으면 기본 로직 사용
      if (!this.templateSelectionRules.rules || this.templateSelectionRules.rules.length === 0) {
        return this.selectTemplateByDefault();
      }

      const prTitle = this.getPRTitle();
      const branchName = execSync("git branch --show-current", {
        encoding: "utf8",
      }).trim();
      const lastCommit = execSync("git log -1 --pretty=%B", {
        encoding: "utf8",
      }).trim();

      // 우선순위로 정렬
      const sortedRules = [...this.templateSelectionRules.rules].sort(
        (a, b) => (a.priority || 999) - (b.priority || 999)
      );

      // 각 규칙에 대해 테스트
      for (const rule of sortedRules) {
        const { condition, pattern, template } = rule;
        let testValue = "";

        switch (condition) {
          case "pr_title":
            testValue = prTitle;
            break;
          case "branch":
            testValue = branchName;
            break;
          case "commit":
            testValue = lastCommit;
            break;
          default:
            continue;
        }

        if (testValue && new RegExp(pattern, "i").test(testValue)) {
          console.log(`템플릿 선택 규칙 매치: ${condition}="${testValue}" -> ${template}`);
          return template;
        }
      }

      // 매치되는 규칙이 없으면 기본 템플릿 사용
      return this.templateSelectionRules.defaultTemplate || DEFAULT_CONFIG.defaultTemplate;
    } catch (error) {
      console.error(ERROR_MESSAGES.templateSelectionFailed, error.message);
      return this.templateSelectionRules.defaultTemplate || DEFAULT_CONFIG.defaultTemplate;
    }
  }

  // 기본 템플릿 선택 로직 (하위 호환성)
  selectTemplateByDefault() {
    try {
      const branchName = execSync("git branch --show-current", {
        encoding: "utf8",
      }).trim();
      const lastCommit = execSync("git log -1 --pretty=%B", {
        encoding: "utf8",
      }).trim();

      // 브랜치명 기반 선택
      for (const [template, patterns] of Object.entries(DEFAULT_TEMPLATE_PATTERNS)) {
        if (patterns.some(pattern => branchName.includes(pattern))) {
          return template;
        }
      }

      // 커밋 메시지 기반 선택
      const lowerCommit = lastCommit.toLowerCase();
      for (const [template, patterns] of Object.entries(DEFAULT_COMMIT_PATTERNS)) {
        if (patterns.some(pattern => lowerCommit.startsWith(pattern))) {
          return template;
        }
      }

      return DEFAULT_CONFIG.defaultTemplate;
    } catch (error) {
      console.error(ERROR_MESSAGES.templateSelectionFailed, error.message);
      return DEFAULT_CONFIG.defaultTemplate;
    }
  }

  // 템플릿 파일 읽기
  readTemplate(templateName) {
    const templatePath = path.join(this.templateDir, `${templateName}.md`);
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf8");
    }

    // 기본 템플릿 생성
    console.log(
      `템플릿 파일이 없어서 기본 템플릿을 생성합니다: ${templatePath}`
    );
    return this.createDefaultTemplate(templateName);
  }

  // 기본 템플릿 생성
  createDefaultTemplate(templateName) {
    return DEFAULT_TEMPLATES[templateName] || DEFAULT_TEMPLATES.default;
  }

  // AI API로 내용 생성 (다중 제공자 지원)
  async generateContent(diff, changedFiles, template) {
    const systemPrompt = this.loadSystemPrompt();
    const userPrompt = `다음 Git Diff와 변경된 파일 목록을 분석하여, 시스템 프롬프트의 지침에 따라 PR 템플릿의 각 \`<!-- AI가 자동으로 채워줍니다 -->\` 섹션을 채워주세요.

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

    try {
      console.log(`🤖 Using ${this.aiProvider} with model ${this.model}`);

      switch (this.aiProvider) {
        case "claude":
          return await this.generateWithClaude(systemPrompt, userPrompt);
        case "openai":
          return await this.generateWithOpenAI(systemPrompt, userPrompt);
        case "google":
          return await this.generateWithGoogle(systemPrompt, userPrompt);
        case "vertex-ai":
          return await this.generateWithVertexAI(systemPrompt, userPrompt);
        case "groq":
          return await this.generateWithGroq(systemPrompt, userPrompt);
        case "huggingface":
          return await this.generateWithHuggingFace(systemPrompt, userPrompt);
        default:
          throw new Error(`Unsupported AI provider: ${this.aiProvider}`);
      }
    } catch (error) {
      console.error(`${this.aiProvider} API 호출 실패:`, error.message);
      return null;
    }
  }

  async generateWithClaude(systemPrompt, userPrompt) {
    const anthropic = new Anthropic({ apiKey: this.apiKey });
    const message = await anthropic.messages.create({
      model: this.model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    return message.content[0].text;
  }

  async generateWithOpenAI(systemPrompt, userPrompt) {
    const openai = new OpenAI({ apiKey: this.apiKey });
    const completion = await openai.chat.completions.create({
      model: this.model,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return completion.choices[0].message.content;
  }

  async generateWithGoogle(systemPrompt, userPrompt) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.model });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt },
    ]);
    return result.response.text();
  }

  async generateWithVertexAI(systemPrompt, userPrompt) {
    const projectId = process.env.PROJECT_ID;
    const location = process.env.LOCATION || "us-central1";

    if (!projectId) {
      throw new Error(
        "PROJECT_ID environment variable is required for Vertex AI"
      );
    }

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${this.model}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Vertex AI API error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  }

  async generateWithGroq(systemPrompt, userPrompt) {
    const groq = new Groq({ apiKey: this.apiKey });
    const completion = await groq.chat.completions.create({
      model: this.model,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return completion.choices[0].message.content;
  }

  async generateWithHuggingFace(systemPrompt, userPrompt) {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `${systemPrompt}\n\nUser: ${userPrompt}`,
          parameters: { max_length: 1000 },
        }),
      }
    );

    const result = await response.json();
    return result[0]?.generated_text || result.generated_text;
  }

  // 템플릿에 규칙 기반 정보 적용
  applyRulesToTemplate(template, extractedInfo) {
    let filledTemplate = template;

    for (const rule of this.rules) {
      const { pattern, targetSection } = rule;
      const key = pattern; // 패턴을 키로 사용

      if (extractedInfo[key] && extractedInfo[key].length > 0) {
        const items = extractedInfo[key].map((item) => `- ${item}`).join("\n");
        const sectionRegex = new RegExp(`(${targetSection})`, "i");

        if (sectionRegex.test(filledTemplate)) {
          // 섹션이 이미 존재하면, placeholder와 "해당 없음"을 모두 교체
          const placeholderRegex = new RegExp(
            `(${targetSection}(\\s*\\n)*?)(-\\s*\\n|-|해당\\s*없음)`,
            "i"
          );
          if (placeholderRegex.test(filledTemplate)) {
            filledTemplate = filledTemplate.replace(
              placeholderRegex,
              `$1${items}\n`
            );
          } else {
            filledTemplate = filledTemplate.replace(
              sectionRegex,
              `$1\n${items}`
            );
          }
        } else {
          // 섹션이 없으면 템플릿 끝에 추가합니다.
          filledTemplate += `\n\n${targetSection}\n${items}`;
        }
      } else {
        // 추출된 정보가 없으면 "해당 없음"으로 표시
        const sectionRegex = new RegExp(`(${targetSection})`, "i");
        if (sectionRegex.test(filledTemplate)) {
          const placeholderRegex = new RegExp(
            `(${targetSection}(\\s*\\n)*?)(-\\s*\\n|-)`,
            "i"
          );
          if (placeholderRegex.test(filledTemplate)) {
            filledTemplate = filledTemplate.replace(
              placeholderRegex,
              `$1해당 없음\n`
            );
          }
        }
      }
    }
    return filledTemplate;
  }

  // 규칙에 따라 정보 추출
  extractInfoByRules(commitMessages, branchName) {
    const extractedInfo = {};
    if (this.rules.length === 0) return extractedInfo;

    const sources = [commitMessages, branchName].join("\n");

    for (const rule of this.rules) {
      const { pattern, targetSection } = rule;
      const regex = new RegExp(pattern, "g");
      const matches = sources.match(regex) || [];
      const uniqueMatches = [...new Set(matches)];

      if (uniqueMatches.length > 0) {
        // pattern을 키로 사용하여 저장
        if (!extractedInfo[pattern]) {
          extractedInfo[pattern] = [];
        }
        extractedInfo[pattern].push(...uniqueMatches);
      }
    }

    return extractedInfo;
  }

  // 메인 실행 함수
  async generate() {
    try {
      console.log(SUCCESS_MESSAGES.generationStarted);
      console.log(`📡 AI Provider: ${this.aiProvider}`);
      console.log(`🎯 Model: ${this.model}`);

      // 1. Git diff 분석
      const { diff, changedFiles } = await this.getGitDiff();
      if (!diff && changedFiles.length === 0) {
        console.log(ERROR_MESSAGES.noChanges);
        this.setOutput("content-generated", "false");
        return;
      }

      // 2. 템플릿 선택 및 읽기
      const templateName = this.selectTemplate();
      console.log(`${SUCCESS_MESSAGES.templateSelected} ${templateName}`);
      this.setOutput("template-used", templateName);
      const originalTemplate = this.readTemplate(templateName);

      // 3. AI로 내용 생성
      let aiFilledTemplate = originalTemplate;
      if (this.apiKey) {
        console.log(SUCCESS_MESSAGES.aiGenerating);
        const aiGeneratedContent = await this.generateContent(
          diff,
          changedFiles,
          originalTemplate
        );
        if (aiGeneratedContent) {
          aiFilledTemplate = aiGeneratedContent;
        } else {
          console.log(ERROR_MESSAGES.aiGenerationFailed);
        }
      } else {
        console.log("ℹ️ API 키가 없어서 기본 템플릿만 사용합니다.");
      }

      // 4. 규칙 기반 정보 추출 및 최종 템플릿에 적용
      const commitMessages = await this.getCommitMessages();
      const branchName = execSync("git branch --show-current", {
        encoding: "utf8",
      }).trim();
      const extractedInfo = this.extractInfoByRules(commitMessages, branchName);
      console.log("🔍 추출된 정보:", JSON.stringify(extractedInfo, null, 2));
      const finalContent = this.applyRulesToTemplate(
        aiFilledTemplate,
        extractedInfo
      );

      // 5. 파일로 저장
      fs.writeFileSync(OUTPUT_FILENAME, finalContent);
      this.setOutput("content-generated", "true");

      console.log(SUCCESS_MESSAGES.generationComplete);

      return finalContent;
    } catch (error) {
      console.error("❌ PR 템플릿 생성 실패:", error.message);
      this.setOutput("content-generated", "false");
      process.exit(1);
    }
  }

  // GitHub Actions output 설정 (새로운 방식)
  setOutput(name, value) {
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
    } else {
      // 로컬 테스트용 fallback
      console.log(`::set-output name=${name}::${value}`);
    }
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  await importAISDKs();
  const generator = new PRTemplateGenerator();
  await generator.generate();
}

export default PRTemplateGenerator;
