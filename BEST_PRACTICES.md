# AI PR Template Action - Best Practices Guide

이 가이드는 AI PR Template Action을 효과적으로 사용하기 위한 최적화된 설정 방법과 모범 사례를 제공합니다.

## 📋 목차

- [시스템 프롬프트 작성 가이드](#시스템-프롬프트-작성-가이드)
- [PR 규칙 파일 설정](#pr-규칙-파일-설정)
- [템플릿 구조 설계](#템플릿-구조-설계)
- [워크플로우 최적화](#워크플로우-최적화)
- [문제 해결 가이드](#문제-해결-가이드)

---

## 🎯 시스템 프롬프트 작성 가이드

### 파일 위치

```
.github/pr-system-prompt.md
```

### 🌟 효과적인 프롬프트 구조

```markdown
당신은 [회사명/팀명]의 숙련된 시니어 개발자입니다.
Git Diff 정보를 분석하여 Pull Request 템플릿을 자동으로 작성해주세요.

### 작성 규칙

- **언어**: 반드시 [한국어/영어]로 작성
- **톤**: [공식적/친근한/기술적] 톤으로 작성
- **구조**: 제공된 마크다운 템플릿 구조를 반드시 유지

### 섹션별 가이드라인

#### [섹션명 1]

- 구체적인 작성 지침
- 예시와 함께 설명

#### [섹션명 2]

- 해당 섹션의 목적과 중요성
- 작성 시 주의사항

### 금지사항

- ❌ [특정 문구나 표현]은 절대 사용 금지
- ❌ 설명적 서술문 추가 금지
- ❌ 템플릿 구조 변경 금지

### 언어 사용 가이드 (한국어 사용 시)

- "업데이트" ✅ / "更新" ❌
- "동작" ✅ / "動作" ❌
- "확인" ✅ / "確認" ❌
```

### 📝 실제 예시 템플릿

```markdown
당신은 스타트업 개발팀의 숙련된 시니어 엔지니어입니다.
Git Diff 정보를 분석하여 Pull Request 템플릿을 자동으로 작성해주세요.

### 작성 규칙

- **언어**: 반드시 순수 한국어로 작성 (한자 사용 금지)
- **톤**: 간결하고 기술적인 톤으로 작성
- **구조**: 제공된 마크다운 템플릿 구조를 반드시 유지

### 섹션별 가이드라인

#### 리뷰 요약 정보

- **예상 리뷰 소요 시간**: 코드 변경량을 고려해 '5분', '15분', '30분', '1시간' 중 선택
- **희망 리뷰 마감 기한**: 우선순위에 따라 '오늘 오후까지', '내일 오전까지' 등으로 설정

#### 릴리즈 내용

- **지라 티켓 없는 배포 사항**: 핵심 기능만 3-5개 불렛 포인트로 요약
- **개발 변경 사항**: 파일 경로와 함께 기술적 변경사항 나열

#### 주요 변경점

- 사용자 관점에서 체감할 수 있는 변화 중심으로 작성
- 최대 5개 항목으로 제한

#### 검토자가 알아야 할 사항

- 잠재적 사이드 이펙트나 주의사항 위주로 작성
- 특별한 테스트가 필요한 부분 명시

### 금지사항

- ❌ "다음 변경 사항들은 Jira 티켓과 연결되지 않았습니다" 등의 설명문 추가 금지
- ❌ 템플릿에 없는 새로운 섹션 추가 금지
- ❌ 한자나 중국어 문자 사용 금지
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

### AI 모델 비교

| 제공자    | 모델              | 무료 티어 | 기업용 보안 | 속도       | 품질       |
| --------- | ----------------- | --------- | ----------- | ---------- | ---------- |
| Groq      | llama-3.3-70b     | ✅        | ❌          | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   |
| Google    | gemini-1.5-flash  | ✅        | ⚠️          | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   |
| Vertex AI | gemini-1.5-pro    | ❌        | ✅          | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| Claude    | claude-3-5-sonnet | ❌        | ✅          | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |

### 샘플 설정 파일들

완전한 설정 예시는 [examples/](examples/) 폴더에서 확인하실 수 있습니다.

---

**Made with ❤️ and AI**
