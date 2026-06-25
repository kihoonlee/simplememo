# SimpleMemo 배포 (Vercel)

개인용 앱이라 Vercel Hobby 플랜으로 충분합니다. 로컬에서 이미 동작하는 상태라면
아래 순서대로 ① Vercel 프로젝트 연결 → ② 환경변수 등록 → ③ Google Cloud에 배포 도메인 등록만 하면 됩니다.

> 사전 확인(로컬): `npm run build` 성공 · `npm run lint` 0 에러 · `npm test` 11/11 · `PORT=3010 npm run test:e2e` 5/5.

## 1. Vercel 프로젝트 연결

- **대시보드**: https://vercel.com/new 에서 이 GitHub 레포를 Import.
- 또는 **CLI**:
  ```bash
  npm i -g vercel       # 최초 1회
  vercel link           # 레포를 Vercel 프로젝트에 연결
  ```
- 프레임워크는 Next.js로 자동 감지됩니다. 빌드/출력 설정은 기본값 그대로 둡니다
  (`next build`, 별도 `vercel.json` 불필요).

## 2. 환경변수 등록 (Vercel > Project > Settings > Environment Variables)

`.env.local`의 값을 **그대로** 옮깁니다. `NEXT_PUBLIC_*`는 **빌드 타임에 번들로 인라인**되므로
반드시 Vercel에도 등록되어 있어야 브라우저(Picker/토큰 클라이언트)가 동작합니다.
모두 **Production**(원하면 Preview까지) 환경에 추가하세요.

| 변수 | 종류 | 설명 |
|------|------|------|
| `AUTH_SECRET` | 서버 | Auth.js JWT 암호화 키. **유일한 필수 Auth 변수.** (`npx auth secret`로 생성) |
| `AUTH_GOOGLE_ID` | 서버 | Google OAuth 클라이언트 ID |
| `AUTH_GOOGLE_SECRET` | 서버 | Google OAuth 클라이언트 시크릿 |
| `SMEMO_FOLDER_ID` | 서버 | 모든 메모를 강제 저장할 Drive 폴더 ID (풀 `drive` 스코프 필요) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 빌드/브라우저 | = `AUTH_GOOGLE_ID` (브라우저 Picker 토큰 클라이언트용) |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | 빌드/브라우저 | Google Picker API 키 |
| `NEXT_PUBLIC_GOOGLE_APP_ID` | 빌드/브라우저 | Google Cloud 프로젝트 번호 |
| `NEXT_PUBLIC_DEFAULT_FOLDER_ID` | 빌드/브라우저 | Picker 기본 힌트 폴더 (보통 `SMEMO_FOLDER_ID`와 동일) |

> **불필요**: `AUTH_URL`, `AUTH_TRUST_HOST`. Auth.js v5는 Vercel(`VERCEL` 환경변수 자동 감지)에서
> 요청 헤더로 host를 추론하고 `trustHost`를 자동 활성화합니다. 커스텀 도메인에서 콜백이
> 어긋나는 경우에만 `AUTH_URL=https://<도메인>`을 명시하세요.

## 3. Google Cloud Console에 배포 도메인 등록

> **현재 배포 도메인(2026-06-25)**: `https://simplememo-neon.vercel.app`
> (Vercel 프로젝트: `kihoons-projects-8f5230eb/simplememo`, GitHub `kihoonlee/simplememo` 연동)

**API 및 서비스 > 사용자 인증 정보 > OAuth 클라이언트 ID**에 추가:

- **승인된 JavaScript 원본**: `https://simplememo-neon.vercel.app`
- **승인된 리디렉션 URI**: `https://simplememo-neon.vercel.app/api/auth/callback/google`

> 로컬용(`http://localhost:3000` / `.../api/auth/callback/google`)은 그대로 두고 **추가**만 합니다.
> Vercel은 PR마다 프리뷰 도메인이 바뀌므로, 프리뷰에서도 로그인하려면 안정적인 커스텀 도메인을
> 쓰거나 프리뷰 URL을 그때그때 등록해야 합니다(개인용이면 Production 도메인만으로 충분).

OAuth 동의화면은 **External + Testing** 상태를 유지하고 **테스트 사용자에 본인 계정**이 들어 있어야 합니다
(풀 `drive` 스코프는 미검증 상태에서도 테스트 사용자면 사용 가능).

## 4. 배포 & 검증

```bash
vercel --prod        # CLI 배포 (또는 git push 시 Vercel이 자동 배포)
```

배포 후:
1. `https://<도메인>` 접속 → 구글 로그인.
2. **스코프 변경 재동의**: 로컬에서 `drive.file`→풀 `drive`로 바뀐 적이 있으므로, 프로덕션에서도
   최초 로그인 시 동의 화면에 Drive 권한이 표시되는지 확인. 권한이 빠지면 **로그아웃 → 재로그인**.
3. 새 메모 작성 → `SMEMO_FOLDER_ID` 폴더에 `{제목}.md`가 생성되는지 Drive에서 확인.
4. 이미지 첨부 → 그 폴더 하위 `images/`에 업로드 + 링크 공유되는지 확인.

## 참고 / 주의

- **쿠키 보안**: 프로덕션(HTTPS)에서 세션 쿠키가 `__Secure-` 접두어 + `secure`로 발급됩니다.
  Vercel은 HTTPS이므로 자동으로 충족됩니다.
- **PWA**: `/manifest.webmanifest`, `/apple-icon`, `public/sw.js`가 정적 서빙됩니다.
  설치형(홈 화면 추가) 동작은 배포 도메인에서 최종 확인하세요.
- **기존 메모 이전**: 과거에 다른 폴더(`163p1…`)에 저장된 메모가 있다면 Drive에서 수동으로
  `SMEMO_FOLDER_ID` 폴더로 옮겨야 목록에 함께 보입니다.
