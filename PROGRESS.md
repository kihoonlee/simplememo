# PROGRESS — SimpleMemo

> 개인용 모바일 메모 웹앱. 위지윅(Toast UI)으로 작성하고 구글 드라이브에 `.md`로 저장.
> 마지막 업데이트: 2026-06-25 | 브랜치: main | 최근 커밋: 3db27c8

## 현재 상태 (2026-06-25)

핵심 기능 + **Vercel 프로덕션 배포 + UI/UX 리프레시 + 목록 페이지네이션**까지 완료.
빌드·린트·타입체크·유닛(14)·E2E(5) 전부 통과. 남은 건 **실사용 라이브 검증**(특히 무한스크롤/PtR은 실기기에서).

- **앱 URL**: https://simplememo-neon.vercel.app
- **Vercel**: `kihoons-projects-8f5230eb/simplememo` (계정 `powergenes-5279`) · GitHub `kihoonlee/simplememo` 연동(push 시 자동 재배포)
- **Google OAuth**: 배포 도메인 origin + `/api/auth/callback/google` 등록 완료

## 최근 작업 내역

| 날짜 | 작업 | 커밋 | 비고 |
|------|------|------|------|
| 2026-06-25 | **목록 페이지네이션**(최신순 10개씩 무한스크롤) + **pull-to-refresh** + 검색 excerpt 매칭 | 3db27c8 | useMemoList/usePullToRefresh 훅 |
| 2026-06-25 | **UI/UX 적극 리프레시**(디자인토큰·Pretendard·Toss Blue accent·SVG 아이콘) + 카드 본문 미리보기 | f33b26b | 이모지 전부 SVG 교체 |
| 2026-06-25 | React 19 hooks lint 회귀 4건 정리 + Vercel 배포 준비 | 7ac64f7 | playwright PORT 파라미터화 |
| 2026-06-25 | **Vercel 배포 완료** + Google OAuth 도메인 등록 + DEPLOY.md | 7ac64f7 | |
| 2026-06-21 | 메모를 지정 폴더에 강제 저장(`SMEMO_FOLDER_ID`) + 풀 drive 스코프 | 51316df | |
| 2026-06-21 | 저장 시 Toast UI `removeChild` 에러 대응(EditorPane 격리) | 7a746f8 | 실인증 재검증 필요 |
| 2026-06-21 | 위지윅 편집영역 높이 붕괴(본문 작성 불가) 수정 | b2412c5 | |

## UI/UX 디자인 시스템

- `app/globals.css` `@theme` 토큰: `--font-sans`(Pretendard), `--color-brand`(#3182F6 Toss Blue), 시맨틱 색(ink/surface/canvas/line). 전역 a11y: cursor-pointer 복원, `:focus-visible` 링, `prefers-reduced-motion`, `overscroll-behavior-y:none`.
- `components/icons.tsx` — SVG 아이콘 세트(이모지 대체). Pretendard는 `app/layout.tsx`의 `<link>`로 로드.

## 목록 페이지네이션 / 무한스크롤 / PtR

- 서버: `lib/drive/client.ts:listMarkdownPage`(Drive pageToken 커서) → `/api/memos?pageToken` → `{ memos, nextPageToken }`. **보이는 10개만 content 읽음**(초기 로딩 개선).
- 클라: `lib/hooks/useMemoList.ts`(첫 10개+누적), `lib/hooks/usePullToRefresh.ts`(터치 제스처), `app/page.tsx`에서 IntersectionObserver sentinel + pull 인디케이터.
- ⚠️ 검색/필터는 **현재까지 로드된 메모** 기준(스크롤로 더 로드하면 범위 확장). 필요 시 "검색 시 전체 로드"로 변경 가능.

## 배포 (Vercel) — 요약

상세는 [DEPLOY.md](DEPLOY.md). 환경변수 8개 Production 등록 완료. Auth.js v5는 Vercel에서 `AUTH_URL`·`AUTH_TRUST_HOST` 불필요(`AUTH_SECRET`만 필수). 재배포: `git push`(자동) 또는 `vercel --prod --scope kihoons-projects-8f5230eb`.

## 검증 (실행 결과)

- `npm run build` 성공 / `npm run typecheck` 0 에러 / `npm run lint` 0 에러
- `npm test` → **14/14** (frontmatter 왕복, slug, makeExcerpt)
- `PORT=3010 npm run test:e2e` → **5/5** (로그인 렌더, manifest, drive 위임, 위지윅 높이/본문/제목)

## 구현 범위

- **인증**: Auth.js v5 구글 OAuth(풀 `drive`), 토큰 서버세션+refresh — `auth.ts`, `lib/auth-token.ts`
- **드라이브**: REST 래퍼(목록/페이지조회/읽기/생성/수정/휴지통/이미지) — `lib/drive/client.ts`
- **폴더 결정**: `lib/folder-store.ts` — `SMEMO_FOLDER_ID`(강제) > 쿠키(Picker) > 없음(409)
- **API**: `/api/memos`(목록 페이지네이션·생성), `/api/memos/[id]`(조회·수정·삭제·충돌), `/api/images`, `/api/folder`
- **UI**: AppGate/SignIn/FolderPicker/목록(`app/page.tsx`)/MemoEditor/EditorPane + 디자인 토큰·아이콘
- **저장 형식**: `{제목}.md` + YAML frontmatter — `lib/markdown/*` (목록용 `parseMeta`는 excerpt 포함)

## 알려진 이슈 / 주의사항

- **라이브 저장 + 무한스크롤/PtR 실기기 검증** 진행 중(자동 테스트로는 제스처·인증 흐름 검증 어려움).
- 풀 `drive` 스코프 변경 이력 → 프로덕션 최초 로그인 시 Drive 권한 재동의 필요할 수 있음.
- 저장 시 `removeChild` 에러: EditorPane 격리로 대응, 실인증 환경 재검증 필요.
- 기존 메모 2개가 이전 폴더(`163p1…`)에 남아 있어 `1draG…`로 수동 이동 필요.

## 다음 작업

1. **실기기 라이브 검증** — 로그인→작성→저장/수정/삭제/이미지 + 무한스크롤(아래로 추가 로드)·pull-to-refresh(최상단 당김).
2. 기존 메모 2개 폴더 이동(`163p1…` → `1draG…`).
3. (선택) 검색 시 전체 로드 옵션, 이미지 외부 렌더 확인, PWA 설치형 동작 최종 확인.

## 환경 / 개발 메모 (다른 PC에서 이어받을 때)

- **`.env.local` 필수** — `.env.example` 복사 후 채움(`SETUP.md`). ⚠️ 파일명 점(`.`) 빠뜨리지 말 것.
- 의존성: `npm install` → `npx playwright install chromium`(E2E용).
- **git push(개인 repo)**: remote는 SSH alias `git@github-kihoonlee:kihoonlee/simplememo.git`(Mac 키 `~/.ssh/mac_ssh`). HTTPS는 비대화형에서 비밀번호 막힘.
- 로컬 포트 3000이 타 앱에 점유되면 `PORT=3010 npm run dev` / `PORT=3010 npm run test:e2e`.
