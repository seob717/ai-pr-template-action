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

## 🔧 PR 규칙 파일 설정

### 파일 위치

```
.github/pr-rules.json
```

### 기본 구조

```json
{
  "rules": [
    {
      "pattern": "정규표현식",
      "targetSection": "대상 마크다운 섹션"
    }
  ]
}
```

### 🎯 일반적인 사용 사례

#### 1. Jira 티켓 추출

```json
{
  "rules": [
    {
      "pattern": "(PROJ-\\d+)",
      "targetSection": "## 지라 티켓"
    }
  ]
}
```

#### 2. 다양한 티켓 시스템

```json
{
  "rules": [
    {
      "pattern": "(DD-\\d+|FEAT-\\d+|BUG-\\d+)",
      "targetSection": "## 관련 티켓"
    }
  ]
}
```

#### 3. 브랜치 타입별 분류

```json
{
  "rules": [
    {
      "pattern": "(feature|feat)/(\\w+)",
      "targetSection": "## 기능 유형"
    },
    {
      "pattern": "(hotfix|fix)/(\\w+)",
      "targetSection": "## 수정 유형"
    }
  ]
}
```

#### 4. 멀티 룰 설정

```json
{
  "rules": [
    {
      "pattern": "(DD-\\d+)",
      "targetSection": "## 지라 티켓"
    },
    {
      "pattern": "#(\\d+)",
      "targetSection": "## GitHub Issues"
    },
    {
      "pattern": "\\[(breaking|major|minor|patch)\\]",
      "targetSection": "## 변경 수준"
    }
  ]
}
```

### 🔍 정규표현식 팁

| 목적         | 패턴                    | 설명               |
| ------------ | ----------------------- | ------------------ | ----------------------- |
| Jira 티켓    | `(PROJ-\\d+)`           | PROJ-123 형태 매칭 |
| GitHub Issue | `#(\\d+)`               | #123 형태 매칭     |
| 버전 태그    | `v(\\d+\\.\\d+\\.\\d+)` | v1.2.3 형태 매칭   |
| 브랜치 유형  | `(feature               | hotfix)/(\\w+)`    | feature/login 형태 매칭 |
| 영숫자 코드  | `([A-Z]{2,}-\\d+)`      | ABC-123 형태 매칭  |

---

## 📋 템플릿 구조 설계

### 파일 위치

```
.github/pull_request_templates/
├── feature.md
├── hotfix.md
├── release.md
└── bugfix.md
```

### 🌟 효과적인 템플릿 구조

#### 1. 기본 섹션 구조

```markdown
## 🎯 PR 목적

<!-- AI가 자동으로 채워줍니다 -->

## 🔄 주요 변경사항

<!-- AI가 자동으로 채워줍니다 -->

## 📋 상세 내용

### 지라 티켓

-

### 개발 변경사항

<!-- AI가 자동으로 채워줍니다 -->

## ⚠️ 주의사항

<!-- AI가 자동으로 채워줍니다 -->

## ✅ 체크리스트

- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 문서 업데이트
```

#### 2. 팀별 맞춤 템플릿 예시

**프론트엔드 팀용**

```markdown
## 🎨 UI/UX 변경사항

<!-- AI가 자동으로 채워줍니다 -->

## 📱 반응형 테스트

### 테스트 환경

- [ ] Desktop (Chrome, Safari, Firefox)
- [ ] Mobile (iOS Safari, Android Chrome)
- [ ] Tablet

## 🔧 기술적 변경사항

<!-- AI가 자동으로 채워줍니다 -->
```

**백엔드 팀용**

```markdown
## 🔌 API 변경사항

<!-- AI가 자동으로 채워줍니다 -->

## 🗄️ 데이터베이스 변경

<!-- AI가 자동으로 채워줍니다 -->

## 🔒 보안 검토사항

<!-- AI가 자동으로 채워줍니다 -->

## 📊 성능 영향도

<!-- AI가 자동으로 채워줍니다 -->
```

---

## ⚙️ 워크플로우 최적화

### 🚀 권장 워크플로우 설정

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
        uses: seob717/ai-pr-template-action@main
        with:
          ai-provider: "groq" # 빠르고 무료
          api-key: ${{ secrets.GROQ_API_KEY }}
          model: "llama-3.3-70b-versatile"
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

### 🎯 AI 제공자별 추천 설정

#### 무료 사용 (개인/스타트업)

```yaml
# Groq (빠르고 무료)
ai-provider: 'groq'
model: 'llama-3.3-70b-versatile'

# Google Gemini (무료 티어)
ai-provider: 'google'
model: 'gemini-1.5-flash'
```

#### 기업용 (보안 중요)

```yaml
# Vertex AI (기업급 보안)
ai-provider: 'vertex-ai'
model: 'gemini-1.5-pro'
project-id: ${{ secrets.GOOGLE_CLOUD_PROJECT_ID }}
location: 'asia-northeast3'  # Seoul

# Claude Pro (데이터 보호)
ai-provider: 'claude'
model: 'claude-3-5-sonnet-20241022'
```

---

## 🔧 문제 해결 가이드

### 자주 발생하는 문제들

#### 1. 한자나 중국어 문자 출력

**문제**: AI가 "更新", "動作" 등 한자를 사용
**해결책**:

```markdown
### 언어 사용 가이드

- "업데이트" ✅ / "更新" ❌
- "동작" ✅ / "動作" ❌
- **중요**: 한자나 중국어 문자는 절대 사용하지 마세요.
```

#### 2. 불필요한 설명문 추가

**문제**: "다음 변경사항들은 Jira 티켓과 연결되지 않았습니다" 등의 문구
**해결책**:

```markdown
### 금지사항

- ❌ 설명적 서술문 추가 금지
- ❌ "다음 변경사항들은..." 같은 문구 사용 금지
```

#### 3. 지라 티켓이 있는데 "해당 없음" 표시

**확인사항**:

- `pr-rules.json` 파일의 정규표현식 패턴 확인
- 커밋 메시지에 올바른 티켓 번호 포함 여부 확인

#### 4. 템플릿 구조 깨짐

**해결책**:

```markdown
### 구조 유지 규칙

- 제공된 마크다운 헤더(##, ###)를 절대 변경하지 마세요
- 불렛 포인트(-) 형태를 유지하세요
- `<!-- AI가 자동으로 채워줍니다 -->` 플레이스홀더만 교체하세요
```

### 디버깅 팁

#### 1. 로그 확인

```yaml
# 워크플로우에서 디버그 모드 활성화
- name: Generate AI PR Template
  uses: seob717/ai-pr-template-action@main
  env:
    ACTIONS_STEP_DEBUG: true
```

#### 2. 규칙 테스트

```javascript
// 정규표현식 테스트 (브라우저 콘솔에서)
const pattern = /(DD-\d+)/g;
const text = "feat: DD-1234 사용자 로그인 기능 추가";
console.log(text.match(pattern)); // ["DD-1234"]
```

#### 3. 프롬프트 검증

- 간단한 변경사항으로 먼저 테스트
- 한 번에 하나씩 규칙 추가하여 검증
- AI 응답의 일관성 확인

---

## 📚 추가 리소스

### 정규표현식 도구

- [RegexPal](https://www.regexpal.com/) - 온라인 정규표현식 테스터
- [Regex101](https://regex101.com/) - 상세한 정규표현식 분석

### AI Model Performance

For detailed model comparisons and benchmarks, see [Artificial Analysis](https://artificialanalysis.ai/models).

### 샘플 설정 파일들

완전한 설정 예시는 [examples/](examples/) 폴더에서 확인하실 수 있습니다.

---

**Made with ❤️ and AI**
