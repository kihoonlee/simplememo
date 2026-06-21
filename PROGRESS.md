# PROGRESS — SimpleMemo

> 개인용 모바일 메모 웹앱. 위지윅으로 작성하고 구글 드라이브에 `.md`로 저장.

## 현재 상태 (2026-06-21)

핵심 기능(Phase 1–7) 구현 완료. **빌드·타입체크·유닛테스트 모두 통과.**
실제 구글 로그인/드라이브 저장(라이브)은 OAuth 자격증명 입력 후 동작.

### 검증 (실행 결과)
- `npm run build` → 성공 (8 라우트 컴파일)
- `npm run typecheck` → 0 에러
- `npm test` → 11/11 통과 (frontmatter 왕복, slug)
- **라이브 검증** (dev 서버 + 실제 자격증명): `/api/auth/providers` 200 + Google provider 활성, 로그인 리다이렉트 URL에 `drive.file`·`access_type=offline`·`prompt=consent` 포함 확인. 구글 로그인 통과 → 폴더 선택 화면 도달.
- **UI 수정**: OS 다크모드에서 흰 버튼 위 글자가 안 보이던 문제 → 라이트 테마로 고정(`app/globals.css`, `color-scheme: light`). 헤드리스 스크린샷으로 대비 확인.

### 구현 범위
- **인증**: Auth.js v5 구글 OAuth(`drive.file`), 토큰 서버 세션 전용 + refresh — `auth.ts`, `lib/auth-token.ts`, `next-auth.d.ts`
- **드라이브**: REST 래퍼(list/read/create/update/trash/이미지 업로드+링크공유/`images` 폴더 보장/앱폴더 생성) — `lib/drive/client.ts`
- **API 라우트**: `/api/memos`(목록·생성), `/api/memos/[id]`(조회·수정·삭제·충돌감지), `/api/images`(업로드), `/api/folder`(Picker 선택/앱폴더 생성)
- **UI**: `AppGate`/`SignIn`/`FolderPicker`(Google Picker + 앱폴더 폴백), 목록+검색+폴더/태그 필터(`app/page.tsx`), `MemoEditor`(Toast UI 위지윅 + 디바운스 자동저장 + 저장상태 + 충돌 덮어쓰기)
- **저장 형식**: `{제목}.md` + YAML frontmatter(title/created/updated/folder/tags) — `lib/markdown/*`
- **로컬 초안**: IndexedDB — `lib/store/db.ts`
- **검증**: zod — `lib/validation.ts`. 유닛테스트 — `lib/markdown/*.test.ts`

### 설정 / 실행
1. `SETUP.md`대로 구글 클라우드 OAuth 설정 → `.env.local` 채우기
2. `npm run dev` → http://localhost:3000
- 확정 결정: 개인용 / Next.js+Vercel / Toast UI Editor / `drive.file`+Picker / 이미지 링크공유 / 온라인우선+자동저장+로컬초안.
- ⚠️ 구글 동의화면 **User Type은 External**(개인 Gmail). Internal이면 `org_internal`로 로그인 차단됨. 테스트 사용자에 본인 계정 추가.

### 알려진 한계 / 미완
- 인증·폴더선택 화면까지 라이브 확인됨. **메모 작성→드라이브 `.md` 저장까지의 인터랙티브 플로우는 사용자 테스트 진행 중.**
- **PWA**(Serwist 설치됨) 서비스워커/매니페스트 미연결.
- **Playwright E2E** 미작성.
- 목록은 매 로드 시 전 메모 content를 읽어 메타 파싱 — 메모 수 많으면 느려질 수 있음(IndexedDB 메타 캐시로 최적화 여지).
- 이미지 URL은 `drive.google.com/uc?id=` 형식 — 외부 뷰어 렌더는 라이브 확인 필요.

### 다음 작업
- Phase 8: PWA + 모바일 마감, E2E. 라이브 검증. (선택) 목록 메타 캐시.
