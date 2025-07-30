#!/usr/bin/env node

import { Anthropic } from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

class PRTemplateGenerator {
  constructor() {
    this.templateDir = path.join(process.cwd(), '.github', 'pull_request_templates');
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
    throw new Error(`템플릿 파일을 찾을 수 없습니다: ${templatePath}`);
  }

  // Claude API로 내용 생성
  async generateContent(diff, changedFiles, template) {
    const systemPrompt = `
당신은 PR 템플릿을 자동으로 작성하는 AI입니다. 
주어진 git diff와 변경된 파일 목록을 분석해서 다음 섹션들을 채워주세요:

1. 개발 변경 사항: 기술적인 변경점을 간결하게 설명
2. 주요 변경점: 핵심 변경사항을 불릿 포인트로 나열
3. 검토자가 알아야 할 사항: 리뷰어가 특히 주의깊게 봐야 할 부분
4. 예상 리뷰 소요 시간: 변경량을 고려해서 5분, 10분, 30분, 1시간 중 선택

한국어로 작성하고, 각 섹션은 구체적이고 명확하게 작성해주세요.
`;

    const userPrompt = `
변경된 파일들:
${changedFiles.join('\n')}

Git Diff:
${diff}

위 정보를 바탕으로 PR 템플릿의 각 섹션을 채워주세요.
`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Claude API 호출 실패:', error.message);
      return null;
    }
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
      console.log('🤖 AI PR 템플릿 생성기 시작...');
      
      // 1. Git diff 분석
      const { diff, changedFiles } = this.getGitDiff();
      if (!diff && changedFiles.length === 0) {
        console.log('변경사항이 없습니다.');
        console.log('::set-output name=content-generated::false');
        return;
      }
      
      // 2. 템플릿 선택
      const templateName = this.selectTemplate();
      console.log(`📋 선택된 템플릿: ${templateName}`);
      console.log(`::set-output name=template-used::${templateName}`);
      
      // 3. 템플릿 읽기
      const template = this.readTemplate(templateName);
      
      // 4. AI로 내용 생성
      console.log('🧠 Claude로 내용 생성 중...');
      const generatedContent = await this.generateContent(diff, changedFiles, template);
      
      if (!generatedContent) {
        console.error('❌ 내용 생성에 실패했습니다.');
        console.log('::set-output name=content-generated::false');
        return;
      }
      
      // 5. 템플릿 채우기
      const filledTemplate = this.fillTemplate(template, generatedContent);
      
      // 6. 파일로 저장 (GitHub Action에서 사용)
      fs.writeFileSync('pr-template-output.md', filledTemplate);
      console.log('::set-output name=content-generated::true');
      
      console.log('✅ PR 템플릿 생성 완료');
      
      return filledTemplate;
      
    } catch (error) {
      console.error('❌ PR 템플릿 생성 실패:', error.message);
      console.log('::set-output name=content-generated::false');
      process.exit(1);
    }
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new PRTemplateGenerator();
  generator.generate();
}

export default PRTemplateGenerator;