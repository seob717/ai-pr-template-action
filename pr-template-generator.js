#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

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
    this.templateDir = process.env.TEMPLATE_PATH
      ? path.join(process.cwd(), process.env.TEMPLATE_PATH)
      : path.join(process.cwd(), ".github", "pull_request_templates");
    this.rulesPath = path.join(process.cwd(), ".github", "pr-rules.json");
    this.systemPromptPath = path.join(
      process.cwd(),
      ".github",
      "pr-system-prompt.md"
    );
    this.defaultSystemPromptPath = path.join(
      process.cwd(),
      "default-system-prompt.md"
    );
    this.aiProvider = process.env.AI_PROVIDER || "claude";
    this.apiKey = this.getAPIKey();
    this.model = this.getModel();
    this.rules = this.loadRules();

    if (!this.apiKey) {
      console.log(
        "⚠️ No API key found. Will use basic template without AI generation."
      );
    }
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

    const defaultModels = {
      claude: "claude-3-5-sonnet-20241022", // 최신 고성능 모델
      openai: "gpt-4o", // 고성능 모델 (무료 티어 제한적)
      google: "gemini-1.5-flash", // 무료 티어 있음
      "vertex-ai": "gemini-1.5-pro", // 기업용 고성능
      groq: "llama-3.1-70b-versatile", // 더 큰 모델
      huggingface: "microsoft/DialoGPT-medium", // 무료
    };

    return defaultModels[this.aiProvider] || defaultModels.claude;
  }

  // 시스템 프롬프트 로드
  loadSystemPrompt() {
    // 1. 사용자 정의 프롬프트 시도
    if (fs.existsSync(this.systemPromptPath)) {
      try {
        return fs.readFileSync(this.systemPromptPath, "utf8");
      } catch (error) {
        console.error(
          "사용자 정의 시스템 프롬프트 파일 로드 실패:",
          error.message
        );
      }
    }
    // 2. 기본 프롬프트 시도
    if (fs.existsSync(this.defaultSystemPromptPath)) {
      try {
        return fs.readFileSync(this.defaultSystemPromptPath, "utf8");
      } catch (error) {
        console.error("기본 시스템 프롬프트 파일 로드 실패:", error.message);
      }
    }
    // 3. 최후의 폴백 프롬프트
    return "Please describe the changes based on the git diff.";
  }

  // 규칙 파일 로드
  loadRules() {
    if (fs.existsSync(this.rulesPath)) {
      try {
        const content = fs.readFileSync(this.rulesPath, "utf8");
        return JSON.parse(content).rules || [];
      } catch (error) {
        console.error("규칙 파일 로드 또는 파싱 실패:", error.message);
        return [];
      }
    }
    return [];
  }

  // 관련 Git 커밋 메시지 가져오기
  getGitCommitMessages() {
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
      console.warn("커밋 메시지를 가져오는 데 실패했습니다:", error.message);
      // fallback: 마지막 커밋 메시지만 가져오기
      return execSync("git log -1 --pretty=%B", { encoding: "utf8" }).trim();
    }
  }

  // Git diff 분석
  getGitDiff() {
    try {
      const diff = execSync("git diff HEAD~1..HEAD", { encoding: "utf8" });
      const changedFiles = execSync("git diff --name-only HEAD~1..HEAD", {
        encoding: "utf8",
      })
        .split("\n")
        .filter((file) => file.trim());

      return { diff, changedFiles };
    } catch (error) {
      console.error("Git diff 분석 실패:", error.message);
      return { diff: "", changedFiles: [] };
    }
  }

  // 브랜치명이나 커밋 메시지로 템플릿 선택
  selectTemplate() {
    try {
      const branchName = execSync("git branch --show-current", {
        encoding: "utf8",
      }).trim();
      const lastCommit = execSync("git log -1 --pretty=%B", {
        encoding: "utf8",
      }).trim();

      // 브랜치명 기반 선택
      if (branchName.includes("hotfix")) return "hotfix";
      if (branchName.includes("release")) return "release";
      if (branchName.includes("feature") || branchName.includes("feat"))
        return "feature";
      if (branchName.includes("bugfix") || branchName.includes("bug"))
        return "bugfix";

      // 커밋 메시지 기반 선택
      if (lastCommit.toLowerCase().startsWith("hotfix")) return "hotfix";
      if (lastCommit.toLowerCase().startsWith("feat")) return "feature";
      if (lastCommit.toLowerCase().startsWith("fix")) return "bugfix";
      if (lastCommit.toLowerCase().startsWith("release")) return "release";

      return "feature"; // 기본값
    } catch (error) {
      console.error("템플릿 선택 실패:", error.message);
      return "feature";
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
    const templates = {
      feature: `## 🎯 Feature Description

<!-- AI가 자동으로 채워줍니다 -->

## 🔄 Changes Made

<!-- AI가 자동으로 채워줍니다 -->

## 🧪 Testing

- [ ] Manual testing completed

## 📝 Notes for Reviewers

<!-- AI가 자동으로 채워줍니다 -->`,
      default: `## Description

<!-- AI가 자동으로 채워줍니다 -->

## Changes

<!-- AI가 자동으로 채워줍니다 -->

## Testing

<!-- AI가 자동으로 채워줍니다 -->`,
    };

    return templates[templateName] || templates.default;
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
---
${template}
---
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
          // 섹션이 이미 존재하면, placeholder를 교체하거나 바로 아래에 추가합니다.
          const placeholderRegex = new RegExp(
            `(${targetSection}(\\s*\\n)*?)(-\\s*\\n|-)`,
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
      console.log("🤖 AI PR Template Generator 시작...");
      console.log(`📡 AI Provider: ${this.aiProvider}`);
      console.log(`🎯 Model: ${this.model}`);

      // 1. Git diff 분석
      const { diff, changedFiles } = this.getGitDiff();
      if (!diff && changedFiles.length === 0) {
        console.log("변경사항이 없습니다.");
        this.setOutput("content-generated", "false");
        return;
      }

      // 2. 템플릿 선택 및 읽기
      const templateName = this.selectTemplate();
      console.log(`📋 선택된 템플릿: ${templateName}`);
      this.setOutput("template-used", templateName);
      const originalTemplate = this.readTemplate(templateName);

      // 3. AI로 내용 생성
      let aiFilledTemplate = originalTemplate;
      if (this.apiKey) {
        console.log("🧠 AI로 내용 생성 중...");
        const aiGeneratedContent = await this.generateContent(
          diff,
          changedFiles,
          originalTemplate
        );
        if (aiGeneratedContent) {
          aiFilledTemplate = aiGeneratedContent;
        } else {
          console.log("⚠️ AI 생성 실패, 기본 템플릿만 사용합니다.");
        }
      } else {
        console.log("ℹ️ API 키가 없어서 기본 템플릿만 사용합니다.");
      }

      // 4. 규칙 기반 정보 추출 및 최종 템플릿에 적용
      const commitMessages = this.getGitCommitMessages();
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
      fs.writeFileSync("pr-template-output.md", finalContent);
      this.setOutput("content-generated", "true");

      console.log("✅ PR 템플릿 생성 완료");

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
