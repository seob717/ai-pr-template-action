# AI PR Template Generator - Context Summary

## 📋 프로젝트 개요

Claude AI를 활용하여 PR 생성 시 자동으로 템플릿을 분석하고 채워주는 GitHub Action입니다.

## 🎯 주요 기능

1. **Git diff 분석**: 변경된 파일과 내용을 분석
2. **자동 템플릿 선택**: 브랜치명/커밋 메시지로 적절한 템플릿 선택
3. **AI 기반 내용 생성**: Claude API로 각 섹션 자동 작성
4. **PR description 자동 업데이트**: GitHub API로 PR 설명 업데이트

## 🗂️ 파일 구조

```
ai-pr-template-action/
├── action.yml                    # GitHub Action 메타데이터
├── pr-template-generator.js      # 핵심 로직 스크립트
├── package.json                  # npm 패키지 설정
├── LICENSE                       # MIT 라이선스
├── README.md                     # 사용법 가이드
├── .github/
│   └── workflows/
│       └── test.yml             # Action 테스트 워크플로우
└── examples/
    ├── templates/
    │   ├── feature.md           # 기능 개발 템플릿 예시
    │   └── hotfix.md           # 핫픽스 템플릿 예시
    └── usage.yml               # 사용법 예시
```

## 🔧 핵심 로직

### 템플릿 선택 알고리즘
- 브랜치: `feature/` → `feature.md`, `hotfix/` → `hotfix.md`
- 커밋: `feat:` → `feature.md`, `fix:` → `bugfix.md`
- 기본값: `feature.md`

### Claude AI 프롬프트
- 시스템: PR 템플릿 작성 전문 AI로 설정
- 사용자: git diff + 변경 파일 목록 제공
- 응답: 각 섹션별 내용 생성 (개발 변경 사항, 주요 변경점, 검토자 주의사항, 예상 리뷰 시간)

### GitHub API 연동
- PR description 업데이트
- 성공/실패 코멘트 추가
- GitHub Actions outputs 설정

## 🚀 사용법

1. 새 public repository 생성: `ai-pr-template-action`
2. 위 파일들 복사
3. `YOUR-USERNAME` 부분을 실제 GitHub 사용자명으로 변경
4. 태그 생성 (`v1`, `v1.0.0`)
5. GitHub Marketplace에 publish (선택사항)

## 🔄 사용자 워크플로우

1. 사용자가 PR 생성
2. GitHub Actions가 트리거됨
3. Action이 git diff 분석
4. 브랜치/커밋으로 템플릿 선택
5. Claude API 호출하여 내용 생성
6. PR description 자동 업데이트
7. 완료 코멘트 추가

## 🎨 커스터마이징 포인트

- `template-path`: 템플릿 디렉토리 경로
- `default-template`: 기본 템플릿명
- 템플릿 선택 로직 (브랜치/커밋 패턴)
- Claude 프롬프트 스타일
- 생성할 섹션 종류

## 🔑 필수 설정

- `ANTHROPIC_API_KEY`: Claude API 키 (repository secret)
- `GITHUB_TOKEN`: PR 수정 권한 (자동 제공)
- Repository permissions: "Read and write permissions" 설정

이 컨텍스트로 새 repository에서 작업을 이어가실 수 있습니다!