# SimpleMemo 설정 (Google Cloud OAuth)

라이브 동작(구글 로그인 + 드라이브 저장)에는 **본인 구글 계정의 OAuth 자격증명**이 필요합니다.
개인용이라 OAuth 동의화면을 'Testing'으로 두고 본인만 테스트 사용자로 등록하면 됩니다.

## 1. Google Cloud 프로젝트
1. https://console.cloud.google.com 에서 프로젝트 생성(또는 기존 사용).
2. 대시보드의 **프로젝트 번호**를 메모 → `NEXT_PUBLIC_GOOGLE_APP_ID`.

## 2. API 사용 설정
**API 및 서비스 > 라이브러리**에서 둘 다 사용 설정:
- **Google Drive API**
- **Google Picker API**

## 3. OAuth 동의화면
- User type: **External** → 'Testing' 상태 유지.
- 앱 이름/지원 이메일 입력.
- **Scopes**: `.../auth/drive.file` 추가(앱이 만든/선택한 파일만).
- **Test users**: 본인 구글 이메일 추가(이게 있어야 로그인 가능).

## 4. 자격증명 (API 및 서비스 > 사용자 인증 정보)
### (a) OAuth 클라이언트 ID — '웹 애플리케이션'
- **승인된 JavaScript 원본**: `http://localhost:3000` (배포 시 `https://<도메인>` 추가)
- **승인된 리디렉션 URI**: `http://localhost:3000/api/auth/callback/google`
  (배포 시 `https://<도메인>/api/auth/callback/google` 추가)
- 생성 후 → `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.

### (b) API 키 — Picker용
- 키 생성 후 **API 제한**을 'Google Picker API'로 제한 → `NEXT_PUBLIC_GOOGLE_API_KEY`.

## 5. .env.local 채우기
`.env.example`를 복사한 `.env.local`(이미 생성됨)에 값 입력:
```
AUTH_SECRET=            # 생성: npx auth secret   (이미 임의값이 채워져 있음)
AUTH_GOOGLE_ID=         # 4(a)
AUTH_GOOGLE_SECRET=     # 4(a)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # = AUTH_GOOGLE_ID (브라우저 Picker 토큰 클라이언트용)
NEXT_PUBLIC_GOOGLE_API_KEY=     # 4(b)
NEXT_PUBLIC_GOOGLE_APP_ID=      # 1 의 프로젝트 번호
NEXT_PUBLIC_DEFAULT_FOLDER_ID=1draGG7AxTJ4_pSSkKbrt1fvEWxbuWHTs
```

## 6. 실행
```
npm run dev
```
- http://localhost:3000 접속 → 구글 로그인 → 최초 1회 Picker로 대상 폴더 선택.
- 새 메모 작성 → 자동으로 `{제목}.md`가 그 폴더에 저장됩니다.

## 참고
- **scope `drive.file`**: 앱이 만든/Picker로 연 파일만 접근(최소권한). 폴더에 앱 밖에서 수동으로 넣은 `.md`는 목록에 안 보일 수 있음.
- **이미지**: `images/` 하위에 업로드되고 '링크가 있는 사용자 보기'로 공유되어 `.md`를 외부 뷰어에서 열어도 보입니다.
- 배포(Vercel) 시 같은 환경변수를 프로젝트 설정에 등록하고, 위 redirect URI/origin에 배포 도메인을 추가하세요.
