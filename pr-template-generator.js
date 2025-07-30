#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// AI Provider imports
let Anthropic, OpenAI, GoogleGenerativeAI, Groq;

// Dynamic imports based on provider
async function importAISDKs() {
  try {
    const anthropicModule = await import('@anthropic-ai/sdk');
    Anthropic = anthropicModule.Anthropic;
  } catch (e) {}
  
  try {
    const openaiModule = await import('openai');
    OpenAI = openaiModule.OpenAI;
  } catch (e) {}
  
  try {
    const googleModule = await import('@google/generative-ai');
    GoogleGenerativeAI = googleModule.GoogleGenerativeAI;
  } catch (e) {}
  
  try {
    const groqModule = await import('groq-sdk');
    Groq = groqModule.Groq;
  } catch (e) {}
}

class PRTemplateGenerator {
  constructor() {
    this.templateDir = process.env.TEMPLATE_PATH 
      ? path.join(process.cwd(), process.env.TEMPLATE_PATH)
      : path.join(process.cwd(), '.github', 'pull_request_templates');
    
    this.aiProvider = process.env.AI_PROVIDER || 'claude';
    this.apiKey = this.getAPIKey();
    this.model = this.getModel();
    
    // API 키 검증
    if (!this.apiKey) {
      console.log('⚠️ No API key found. Will use basic template without AI generation.');
    }
  }

  // API 키 가져오기 (우선순위: api-key > 개별 키)
  getAPIKey() {
    if (process.env.API_KEY) return process.env.API_KEY;
    
    switch (this.aiProvider) {
      case 'claude': return process.env.ANTHROPIC_API_KEY;
      case 'openai': return process.env.OPENAI_API_KEY;
      case 'google': return process.env.GOOGLE_API_KEY;
      case 'vertex-ai': return process.env.VERTEX_AI_API_KEY;
      case 'groq': return process.env.GROQ_API_KEY;
      default: return process.env.ANTHROPIC_API_KEY;
    }
  }

  // 모델 선택
  getModel() {
    if (process.env.MODEL) return process.env.MODEL;
    
    const defaultModels = {
      claude: 'claude-3-5-sonnet-20241022', // 최신 고성능 모델
      openai: 'gpt-4o', // 고성능 모델 (무료 티어 제한적)
      google: 'gemini-1.5-flash', // 무료 티어 있음
      'vertex-ai': 'gemini-1.5-pro', // 기업용 고성능
      groq: 'llama-3.1-70b-versatile', // 더 큰 모델
      huggingface: 'microsoft/DialoGPT-medium' // 무료
    };
    
    return defaultModels[this.aiProvider] || defaultModels.claude;
  }

  // Git diff 분석
  getGitDiff() {
    try {
      const diff = execSync('git diff HEAD~1..HEAD', { encoding: 'utf8' });
      const changedFiles = execSync('git diff --name-only HEAD~1..HEAD', { encoding: 'utf8' })
        .split('\n')
        .filter(file => file.trim());
      
      return { diff, changedFiles };
    } catch (error) {
      console.error('Git diff 분석 실패:', error.message);
      return { diff: '', changedFiles: [] };
    }
  }

  // 브랜치명이나 커밋 메시지로 템플릿 선택
  selectTemplate() {
    try {
      const branchName = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const lastCommit = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
      
      // 브랜치명 기반 선택
      if (branchName.includes('hotfix')) return 'hotfix';
      if (branchName.includes('release')) return 'release';
      if (branchName.includes('feature') || branchName.includes('feat')) return 'feature';
      if (branchName.includes('bugfix') || branchName.includes('bug')) return 'bugfix';
      
      // 커밋 메시지 기반 선택
      if (lastCommit.toLowerCase().startsWith('hotfix')) return 'hotfix';
      if (lastCommit.toLowerCase().startsWith('feat')) return 'feature';
      if (lastCommit.toLowerCase().startsWith('fix')) return 'bugfix';
      if (lastCommit.toLowerCase().startsWith('release')) return 'release';
      
      return 'feature'; // 기본값
    } catch (error) {
      console.error('템플릿 선택 실패:', error.message);
      return 'feature';
    }
  }

  // 템플릿 파일 읽기
  readTemplate(templateName) {
    const templatePath = path.join(this.templateDir, `${templateName}.md`);
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf8');
    }
    
    // 기본 템플릿 생성
    console.log(`템플릿 파일이 없어서 기본 템플릿을 생성합니다: ${templatePath}`);
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

- [ ] Unit tests added
- [ ] Integration tests updated
- [ ] Manual testing completed

## 📝 Notes for Reviewers

<!-- AI가 자동으로 채워줍니다 -->`,
      hotfix: `## 🚨 Issue Description

<!-- AI가 자동으로 채워줍니다 -->

## 🔧 Fix Applied

<!-- AI가 자동으로 채워줍니다 -->

## 🧪 Verification

<!-- AI가 자동으로 채워줍니다 -->`,
      default: `## Description

<!-- AI가 자동으로 채워줍니다 -->

## Changes

<!-- AI가 자동으로 채워줍니다 -->

## Testing

<!-- AI가 자동으로 채워줍니다 -->`
    };
    
    return templates[templateName] || templates.default;
  }

  // AI API로 내용 생성 (다중 제공자 지원)
  async generateContent(diff, changedFiles, template) {
    const systemPrompt = `
You are an AI that automatically writes PR templates.
Analyze the given git diff and list of changed files and fill in the following sections:

1. Development changes: Briefly describe technical changes
2. Key changes: List core changes as bullet points  
3. Reviewer notes: Areas reviewers should pay special attention to
4. Estimated review time: Choose from 5 minutes, 10 minutes, 30 minutes, 1 hour based on change volume

Write in Korean and make each section specific and clear.
`;

    const userPrompt = `
Changed files:
${changedFiles.join('\n')}

Git Diff:
${diff}

Based on the above information, please fill in each section of the PR template.
`;

    try {
      console.log(`🤖 Using ${this.aiProvider} with model ${this.model}`);
      
      switch (this.aiProvider) {
        case 'claude':
          return await this.generateWithClaude(systemPrompt, userPrompt);
        case 'openai':
          return await this.generateWithOpenAI(systemPrompt, userPrompt);
        case 'google':
          return await this.generateWithGoogle(systemPrompt, userPrompt);
        case 'vertex-ai':
          return await this.generateWithVertexAI(systemPrompt, userPrompt);
        case 'groq':
          return await this.generateWithGroq(systemPrompt, userPrompt);
        case 'huggingface':
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
      messages: [{ role: 'user', content: userPrompt }]
    });
    return message.content[0].text;
  }

  async generateWithOpenAI(systemPrompt, userPrompt) {
    const openai = new OpenAI({ apiKey: this.apiKey });
    const completion = await openai.chat.completions.create({
      model: this.model,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    return completion.choices[0].message.content;
  }

  async generateWithGoogle(systemPrompt, userPrompt) {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.model });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    return result.response.text();
  }

  async generateWithVertexAI(systemPrompt, userPrompt) {
    const projectId = process.env.PROJECT_ID;
    const location = process.env.LOCATION || 'us-central1';
    
    if (!projectId) {
      throw new Error('PROJECT_ID environment variable is required for Vertex AI');
    }

    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${this.model}:generateContent`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `${systemPrompt}\n\n${userPrompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Vertex AI API error: ${response.status} ${response.statusText}`);
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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    return completion.choices[0].message.content;
  }

  async generateWithHuggingFace(systemPrompt, userPrompt) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `${systemPrompt}\n\nUser: ${userPrompt}`,
        parameters: { max_length: 1000 }
      })
    });
    
    const result = await response.json();
    return result[0]?.generated_text || result.generated_text;
  }

  // 템플릿에 생성된 내용 적용
  fillTemplate(template, generatedContent) {
    // 간단한 파싱으로 각 섹션 추출 (실제로는 더 정교하게 구현)
    let filledTemplate = template;
    
    // 생성된 내용을 적절한 섹션에 배치
    // 이 부분은 Claude 응답 형식에 따라 조정 필요
    const sections = this.parseGeneratedContent(generatedContent);
    
    if (sections.developmentChanges) {
      filledTemplate = filledTemplate.replace(/## 개발 변경 사항\n\n-/, `## 개발 변경 사항\n\n${sections.developmentChanges}`);
    }
    
    if (sections.majorChanges) {
      filledTemplate = filledTemplate.replace(/## 주요 변경점\n\n-/, `## 주요 변경점\n\n${sections.majorChanges}`);
    }
    
    if (sections.reviewerNotes) {
      filledTemplate = filledTemplate.replace(/## 검토자가 알아야 할 사항\n\n-/, `## 검토자가 알아야 할 사항\n\n${sections.reviewerNotes}`);
    }
    
    if (sections.reviewTime) {
      filledTemplate = filledTemplate.replace(/- 예상 리뷰 소요 시간: e\.g\., 5분, 30분/, `- 예상 리뷰 소요 시간: ${sections.reviewTime}`);
    }
    
    return filledTemplate;
  }

  // 생성된 내용 파싱 (Claude 응답을 섹션별로 분리)
  parseGeneratedContent(content) {
    // 이 부분은 Claude 응답 형식에 따라 정교하게 구현 필요
    const sections = {};
    
    // 간단한 예시 - 실제로는 정규표현식이나 더 정교한 파싱 필요
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];
    
    for (const line of lines) {
      if (line.includes('개발 변경 사항') || line.includes('변경 사항')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'developmentChanges';
        currentContent = [];
      } else if (line.includes('주요 변경점')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'majorChanges';
        currentContent = [];
      } else if (line.includes('검토자') || line.includes('리뷰어')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'reviewerNotes';
        currentContent = [];
      } else if (line.includes('소요 시간') || line.includes('리뷰 시간')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'reviewTime';
        currentContent = [];
      } else if (currentSection && line.trim()) {
        currentContent.push(line);
      }
    }
    
    if (currentSection) sections[currentSection] = currentContent.join('\n');
    
    return sections;
  }

  // 메인 실행 함수
  async generate() {
    try {
      console.log('🤖 AI PR Template Generator 시작...');
      console.log(`📡 AI Provider: ${this.aiProvider}`);
      console.log(`🎯 Model: ${this.model}`);
      
      // 1. Git diff 분석
      const { diff, changedFiles } = this.getGitDiff();
      if (!diff && changedFiles.length === 0) {
        console.log('변경사항이 없습니다.');
        this.setOutput('content-generated', 'false');
        return;
      }
      
      // 2. 템플릿 선택
      const templateName = this.selectTemplate();
      console.log(`📋 선택된 템플릿: ${templateName}`);
      this.setOutput('template-used', templateName);
      
      // 3. 템플릿 읽기
      const template = this.readTemplate(templateName);
      
      // 4. AI로 내용 생성
      let generatedContent = null;
      let filledTemplate = template;
      
      if (this.apiKey) {
        console.log('🧠 AI로 내용 생성 중...');
        generatedContent = await this.generateContent(diff, changedFiles, template);
        
        if (generatedContent) {
          // 5. 템플릿 채우기
          filledTemplate = this.fillTemplate(template, generatedContent);
        } else {
          console.log('⚠️ AI 생성 실패, 기본 템플릿을 사용합니다.');
        }
      } else {
        console.log('ℹ️ API 키가 없어서 기본 템플릿을 사용합니다.');
      }
      
      // 6. 파일로 저장 (GitHub Action에서 사용)
      fs.writeFileSync('pr-template-output.md', filledTemplate);
      this.setOutput('content-generated', 'true');
      
      console.log('✅ PR 템플릿 생성 완료');
      
      return filledTemplate;
      
    } catch (error) {
      console.error('❌ PR 템플릿 생성 실패:', error.message);
      this.setOutput('content-generated', 'false');
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