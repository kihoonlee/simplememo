# PROGRESS — SimpleMemo

> 개인용 모바일 메모 웹앱. 위지윅으로 작성하고 구글 드라이브에 `.md`로 저장.
> 마지막 업데이트: 2026-06-25 | 브랜치: main | 최근 커밋: 7ac64f7

## 현재 상태 (2026-06-25)

핵심 기능(Phase 1–7) 구현 완료 + **Vercel 프로덕션 배포 완료 + Google OAuth 도메인 등록 완료.**
빌드·린트·타입체크·유닛·E2E 전부 통과. 이제 **실사용 라이브 검증(로그인→작성→Drive 저장)** 단계만 남음.

- **앱 URL**: https://simplememo-neon.vercel.app
- **Vercel 프로젝트**: `kihoons-projects-8f5230eb/simplememo` (계정 `powergenes-5279`)
- **GitHub**: `kihoonlee/simplememo` 연동 → `git push` 시 Vercel 자동 재배포
- **Google OAuth**: 배포 도메인 origin + `/api/auth/callback/google` 등록 완료(2026-06-25)

## 최근 작업 내역

| 날짜 | 작업 | 커밋 | 비고 |
|------|------|------|------|
| 2026-06-25 | **Vercel 배포 완료** (link→env 8개→`--prod`), Google OAuth 도메인 등록, [DEPLOY.md](DEPLOY.md) 작성 | 7ac64f7 | 안정 도메인 `simplememo-neon.vercel.app` |
| 2026-06-25 | **lint 회귀 4건 수정** (React 19 새 hooks 규칙) — 동작 보존 | 7ac64f7 | EditorPane/MemoEditor/AppGate |
| 2026-06-25 | playwright 포트 파라미터화(`PORT` env) — 타 앱 3000 점유 충돌 회피 | 7ac64f7 | `PORT=3010 npm run test:e2e` |
| 2026-06-21 | 메모를 지정 폴더에 강제 저장(`SMEMO_FOLDER_ID`) + 풀 drive 스코프 | 51316df | Picker/쿠키 무시 |
| 2026-06-21 | 목록에 '저장 위치'(폴더명+Drive 링크) 표시 | a136edc | 저장 폴더 진단용 |
| 2026-06-21 | 저장 시 Toast UI `removeChild` 에러 대응(EditorPane 격리) | 7a746f8 | 실인증 재검증 필요 |
| 2026-06-21 | 위지윅 편집영역 높이 붕괴(본문 작성 불가) 수정 | b2412c5 | relative+absolute inset-0 |

## 배포 (Vercel) — 요약

상세 절차는 [DEPLOY.md](DEPLOY.md). 핵심:
- 환경변수 8개 Production 등록 완료: `AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `SMEMO_FOLDER_ID`, `NEXT_PUBLIC_*`×4. (`VERCEL_OIDC_TOKEN`은 Vercel 자동 관리)
- Auth.js v5는 Vercel에서 `AUTH_URL`·`AUTH_TRUST_HOST` **불필요**(자동 추론). `AUTH_SECRET`만 필수.
- 재배포: `git push`(자동) 또는 `vercel --prod --scope kihoons-projects-8f5230eb`.
- 헬스체크 통과: 홈 200 · `/api/auth/providers` google 활성 · `/manifest.webmanifest` 200.

## 검증 (실행 결과)

- `npm run build` → 성공 (11 라우트) / `npm run typecheck` → 0 에러
- `npm test` → 11/11 (frontmatter 왕복, slug)
- `PORT=3010 npm run test:e2e` → **5/5** (로그인 렌더, manifest standalone, drive 위임, 위지윅 본문/제목 입력)
- `npm run lint` → **0 에러** (이전 4건 회귀 → 0)

## 구현 범위

- **인증**: Auth.js v5 구글 OAuth(풀 `drive` 스코프), 토큰 서버 세션 전용 + refresh — `auth.ts`, `lib/auth-token.ts`
- **드라이브**: REST 래퍼(list/read/create/update/trash/이미지 업로드+링크공유/`images` 폴더 보장) — `lib/drive/client.ts`
- **폴더 결정**: `lib/folder-store.ts` — `SMEMO_FOLDER_ID`(강제) > 쿠키(Picker 선택) > 없음(409)
- **API**: `/api/memos`(목록·생성), `/api/memos/[id]`(조회·수정·삭제·충돌감지), `/api/images`, `/api/folder`
- **UI**: `AppGate`/`SignIn`/`FolderPicker`, 목록+검색+필터(`app/page.tsx`), `MemoEditor`(Toast UI 위지윅 + 디바운스 자동저장 + 충돌 덮어쓰기), `EditorPane`(에디터 격리)
- **저장 형식**: `{제목}.md` + YAML frontmatter — `lib/markdown/*`
- **로컬 초안**: IndexedDB — `lib/store/db.ts` / **검증**: zod — `lib/validation.ts`

## 알려진 이슈 / 주의사항

- **라이브 저장 플로우는 실사용 검증 진행 중** — 도메인·OAuth 등록까지 완료됐으므로 이제 프로덕션에서 로그인→작성→Drive 저장이 실제로 되는지만 확인하면 됨.
- 풀 `drive` 스코프 변경 이력 → 프로덕션 최초 로그인 시 Drive 권한 **재동의** 필요할 수 있음(권한 누락 시 로그아웃→재로그인).
- 저장 시 `removeChild` 에러: EditorPane 격리로 대응했으나 헤드리스 재현 안 됨 → 실인증·IME 환경 재검증 필요.
- 기존 메모 2개가 이전 폴더(`163p1…`)에 남아 있어 `SMEMO_FOLDER_ID` 폴더(`1draG…`)로 수동 이동 필요.
- 목록은 매 로드 시 전 메모 content 파싱 → 메모 많아지면 느려질 수 있음(IndexedDB 메타 캐시 여지).

## 다음 작업

1. **라이브 저장 검증** — 프로덕션(또는 로컬)에서 로그인→메모 작성→`1draG…` 폴더에 `.md` 저장/수정/삭제/이미지 확인.
2. 기존 메모 2개 폴더 이동(`163p1…` → `1draG…`).
3. (선택) 목록 IndexedDB 메타 캐시, 이미지 외부 뷰어 렌더 확인, PWA 설치형 동작 최종 확인.

## 환경 / 개발 메모 (다른 PC에서 이어받을 때)

- **`.env.local` 필수** — `.env.example` 복사 후 채움(`SETUP.md`). gitignore라 clone 시 안 따라옴. ⚠️ 파일명 점(`.`) 빠뜨리지 말 것(`env.local`이면 Next.js가 못 읽음).
- 의존성: `npm install` → `npx playwright install chromium`(E2E용).
- **git push (개인 repo)**: remote는 SSH alias `git@github-kihoonlee:kihoonlee/simplememo.git` 사용(Mac 키 `~/.ssh/mac_ssh`). HTTPS는 비대화형에서 비밀번호 막힘.
- 로컬 dev 포트 3000이 타 앱에 점유되면 `PORT=3010 npm run dev` / `PORT=3010 npm run test:e2e`.
