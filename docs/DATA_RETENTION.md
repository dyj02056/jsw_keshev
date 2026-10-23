# 데이터 보존·백업·복원 계획 (케셰브 on-client, 수정 기준 커밋 dcff5eb29f2b…)

이 문서는 22단계 "데이터 보존 계획" 요구사항에 따라, 이 프로젝트의 데이터 보존·백업·복원 절차와 **제한**을 적습니다. 제공 서버·판정 코드·인증 설정은 수정하지 않습니다.

## 1. 보존 대상과 비대상

| 구분 | 대상 | 위치 | 보존 주체 |
|---|---|---|---|
| 학생 코드 | `student/extension.mjs`, `student/engine-adapter.mjs` | Git 저장소 | 학생 |
| 학생 문서 | `docs/22_REPRODUCTION.md`, `docs/22_STAGE_RESULT.md`, `docs/DATA_RETENTION.md`, `docs/VERSION_SUPPORT.md`, `docs/STUDENT_RUNBOOK.md` | Git 저장소 | 학생 |
| Git 기록 | 커밋 해시·메시지·작성자·시각 | 로컬 저장소 + (선택) GitHub | 학생 |
| 브라우저 상태 | `localStorage`/`sessionStorage` | 사용 안 함 | — |
| 서버 메모리 상태 | `/api/*` 응답(기본 실행) | 로컬 서버(휘발성) | 해당없음 |
| **옵션 조치 저장소(SQLite)** | `alekov_action_intents`, `alekov_action_state`, `alekov_action_audit` 테이블 | 담당자가 명시 제공한 **기존** 애플리케이션 SQLite 파일(프로젝트·Git·제출물 밖 절대경로) | 담당자·운영 |
| AI 자격·연결 정보 | 앱 전용 보관함, native 설정 | 프로젝트 **밖**(Windows 자격 저장소, `-NativeHostConfig` 경로) | 담당자 |
| SDP 인증서·개인키·JWT | 프로젝트 밖 | 담당자 안내 경로 | 담당자 |
| 열쇠·토큰·비밀번호 | `.env` 등 프로젝트 밖 | 담당자 | 담당자 |

**원칙:** 비밀값·인증서·개인 설정 파일은 Git 저장소, 제출물, 문서, 도움정보, 캡처에 넣지 않습니다. `.env.example`은 비밀 없는 예시로만 유지합니다.

## 2. 기본 실행과 옵션 조치 저장소의 구분 (중요)

- **기본 실행(`npm start`, `start-alekov.ps1`, `npm run demo`):** 서버에는 **DB가 없습니다.** 상태는 로컬 서버 메모리에만 있고, 서버를 종료하면 초기화됩니다. `src/actions/README.md`·`src/actions/store.mjs` 기준, `createActionService`는 `databasePath`·`policy`·`resolveContext`·`engine` hook이 **명시적으로 주어지지 않으면 파일을 열지 않고 `ACTION_UNSUPPORTED`** 를 반환합니다. 기본 실행은 이 조건을 충족하지 않으므로 조치 저장소가 만들어지지 않습니다.
- **옵션 조치 저장소(SQLite):** 담당자가 CLI의 `--alekov-actions-config`로 **이미 존재하는** 애플리케이션 SQLite 파일 경로를 명시했을 때만 `src/actions/store.mjs`의 `createActionStore({databasePath})`가 `alekov_action_intents`·`alekov_action_state`·`alekov_action_audit` 테이블을 추가합니다. 이 파일에는 조치 요청·영수증·버전·감사 기록이 **영속** 저장되며, 서버를 종료해도 사라지지 않습니다.
- **새 DB 생성 없음:** `store.mjs`는 지정된 파일이 이미 존재하는 절대경로의 단일 일반 파일(SQLite 헤더 포함, symlink/hardlink 아님)일 때만 동작합니다. 새 DB를 만들지 않습니다.
- **immutable 감사:** `store.mjs`의 trigger가 `alekov_action_intents`·`alekov_action_audit`의 UPDATE/DELETE와 `alekov_action_state`의 DELETE를 거절합니다. 이력은 덮어쓰지 않습니다.
- **기존 테이블 미변경:** 이 모듈은 기존 학생 사건·승인·감사 테이블을 읽거나 수정하지 않습니다.

## 3. 백업 절차

### 3.1 코드·문서(항상)

1. 변경을 작업 폴더에서 커밋합니다. 커밋 메시지는 단계 식별(예: `step-21`, `step-22`)을 포함합니다.
2. 원격(GitHub 비공개 저장소)에 push합니다. 비공개 저장소는 공개로 바꾸지 않습니다.
3. 필요한 경우 로컬 백업:
   git bundle create ..\backup-on-client-current.bundle --all
4. 백업 파일은 프로젝트 폴더 **밖**에 두고, 비밀값·인증서가 포함되지 않았는지 다시 확인합니다.
5. 수정본을 커밋한 뒤 `git rev-parse HEAD` 값을 백업 파일 옆에 적습니다. 현재 문서의 기준 커밋 `dcff5eb29f2b209f221968e110c5f13bc76aa42c`는 수정 전 커밋이므로 최종 복원 대상으로 사용하지 않습니다.

### 3.2 옵션 조치 저장소(SQLite, 담당자가 사용하는 경우만)

- 백업은 **담당자·운영 책임**입니다. 학생 프로젝트·Git·제출물과 분리합니다.
- 백업 명령 예(파일 경로는 담당자 안내 값 사용, 프로젝트 폴더 밖):
  sqlite3 "<담당자 안내 DB 절대경로>" ".backup '<프로젝트 밖 백업 경로>\alekov-actions-2026-10-23.sqlite'"
- 백업 파일에는 조치 요청·영수증·상태·감사 기록이 들어갑니다. **비밀값(확인 티켓 원문)** 은 저장되지 않고 SHA-256 해시만 있습니다(`store.mjs`의 `confirmation_hash`).
- 백업 파일도 프로젝트·Git·제출물 **밖**에 둡니다.

## 4. 복원 절차

### 4.1 코드·문서 복원 (제출 커밋 기준)

1. 새 빈 폴더를 만듭니다(예: `C:\Users\<사용자>\Documents\restore22`).
2. 원격 저장소에서:
   git clone <저장소 URL> on-client
   cd on-client
   git checkout <수정본 최종 제출 커밋 40자리>
   또는 번들에서:
   git clone ..\backup-on-client-current.bundle on-client
   cd on-client
   git checkout <수정본 최종 제출 커밋 40자리>
3. `git rev-parse HEAD`가 위에서 선택한 수정본 최종 제출 커밋과 같은지 확인합니다. 실제 커밋 후 이 문서의 자리표시자를 해당 40자리 값으로 바꿉니다.
4. 런타임·실행 절차는 `docs/STUDENT_RUNBOOK.md` 4장을 따릅니다.
5. 원본 작업 폴더는 지우거나 덮어쓰지 않습니다.

### 4.2 옵션 조치 저장소(SQLite) 복원 (담당자만, 프로젝트 밖)

- **학생은 이 절차를 수행하지 않습니다.** 담당자가 필요 시 원본 DB 파일의 백업본을 별도 위치에서 복원합니다.
- 이 모듈은 기존 테이블의 rollback이나 전체 DB 복원을 하지 않습니다(`src/actions/README.md`). 조치 요청·영수증·감사 이력은 immutable로 취급합니다.
- 복원된 DB로 자동 재집행하지 않습니다. reserved/pending 상태는 unknown으로 reconcile 후 결과 조회만 합니다.

## 5. 절차의 제한

- **기본 실행에는 DB가 없습니다.** 코드·문서 복원만으로는 조치 이력이 복원되지 않습니다.
- **옵션 조치 저장소는 코드가 아닙니다.** Git 저장소 복원으로는 복원되지 않습니다. 담당자가 별도로 안내한 DB 경로와 백업을 사용합니다.
- **AI 자격·SDP 인증서도 코드가 아닙니다.** 담당자가 별도로 안내한 경로와 Windows 자격 저장소를 사용합니다.
- **브라우저 상태는 저장하지 않습니다.** 새로고침 시 화면 상태가 서버에서 다시 조회됩니다.
- **확인 불가·오류 상태는 복원 대상이 아닙니다.** 이는 화면 상태이며, 서버 응답에 따라 다시 나타납니다.
- **Git 이력은 되돌리지 않습니다.** `git reset --hard`, `git push --force`, `git commit --amend`로 이미 공유된 커밋을 덮어쓰지 않습니다.
- **원본 작업 폴더를 지우지 않습니다.** 이 문서의 복원 절차는 새 폴더에서만 수행합니다.
- **비공개 저장소의 원문 제출**은 `docs/STUDENT_LAUNCH_GUIDE.md` 8장 안내를 따릅니다. 저장소를 공개로 바꿀 필요는 없습니다.
- **옵션 조치 저장소에는 조치·감사 기록이 남습니다.** 삭제·변경 요청은 담당자 절차를 따르며, 학생이 임의로 DB를 조작하지 않습니다.

## 6. 이번 기록의 상태

| 항목 | 상태 |
|---|---|
| 원본 작업 폴더 보존 | 확인됨(`git status --short` 빈 출력) |
| 코드·문서 복원 대상 = 수정본 최종 제출 커밋 | 커밋 후 해시 기록 필요 |
| 기본 실행 DB 없음 명시 | 반영 |
| 옵션 SQLite 영속 기록 보존·백업·복구 제한 | 반영 |
| 백업 생성·검증 | 미확인 |
| 새 폴더 복원 | 미확인 |
| 번들 백업 무결성 | 미확인 |
| 인증·설정 파일 새 폴더 미복사 | 이번 기록 시점 규칙으로 정함. 실제 복사 여부 미확인 |
