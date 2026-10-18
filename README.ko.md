[日本語](README.md) | [English](README.en.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md)

# mcp-icloud-mail

Claude 등 AI 도구가 iCloud 메일을 **읽기만** 하는 MCP 서버입니다. IMAP과 앱 전용 암호로 연결합니다.

## 할 수 있는 일

| 도구 | 내용 |
| --- | --- |
| `list_mailboxes` | 폴더 목록과 메일 수·읽지 않은 수 |
| `list_messages` | 폴더의 최신 메일 목록(제목, 보낸 사람, 날짜) |
| `search_messages` | 보낸 사람, 받는 사람, 제목, 본문, 기간, 읽지 않음으로 검색 |
| `get_message` | 메일 한 통의 본문(텍스트)과 첨부 파일 이름 읽기 |

- 보내기, 삭제, 이동, 읽음 표시 기능은 없습니다. 폴더를 읽기 전용으로 열기 때문에 읽어도 읽지 않은 상태로 남습니다.
- 첨부 파일의 내용은 가져오지 않습니다(파일 이름, 종류, 크기만).

## 준비

1. Apple 계정에서 2단계 인증을 켭니다.
2. [account.apple.com](https://account.apple.com) 에 로그인하고 '로그인 및 보안' → 'App 전용 암호'에서 암호를 만듭니다(`xxxx-xxxx-xxxx-xxxx` 형식).
3. Node.js 20 이상을 설치합니다.

## 설치

이 패키지는 npm에 공개되지 않았으므로 GitHub에서 클론해 빌드합니다.

```bash
git clone https://github.com/spa77k/mcp-icloud-mail.git
cd mcp-icloud-mail
npm ci
npm run build
```

빌드하면 `dist/index.js`가 생깁니다. 설정에서는 이 파일을 절대 경로로 지정합니다.

## 설정

아래 `/path/to/mcp-icloud-mail`은 클론한 디렉터리의 절대 경로(`pwd`로 확인할 수 있습니다)로 바꾸세요. 환경 변수는 자리 표시자로 두지 말고 자신의 값으로 바꿉니다.

### Claude Code

```bash
claude mcp add icloud-mail -e ICLOUD_EMAIL=you@icloud.com -e ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx -- node /path/to/mcp-icloud-mail/dist/index.js
```

### Claude Desktop 등(JSON으로 설정하는 클라이언트)

```json
{
  "mcpServers": {
    "icloud-mail": {
      "command": "node",
      "args": ["/path/to/mcp-icloud-mail/dist/index.js"],
      "env": {
        "ICLOUD_EMAIL": "you@icloud.com",
        "ICLOUD_APP_PASSWORD": "xxxx-xxxx-xxxx-xxxx"
      }
    }
  }
}
```

| 환경 변수 | 내용 |
| --- | --- |
| `ICLOUD_EMAIL` | iCloud 메일 주소(`@icloud.com` / `@me.com` / `@mac.com`) |
| `ICLOUD_APP_PASSWORD` | 준비 단계에서 만든 App 전용 암호 |

## 사용 예

- "오늘 온 읽지 않은 메일을 요약해 줘."
- "지난달에 Amazon에서 온 메일을 찾아 줘."
- "받은 편지함의 최신 10통을 목록으로 보여 줘."

## 주의

- App 전용 암호는 iCloud 메일, 연락처, 캘린더 등에 접근할 수 있습니다. 설정 파일을 다른 사람에게 보여 주거나 저장소에 넣지 마세요. 유출되면 account.apple.com에서 해당 암호를 취소하세요.
- 메일 본문은 그대로 AI에 전달됩니다. 모르는 사람의 메일에 "○○를 실행해" 같은 지시가 적혀 있더라도 AI가 따르지 않도록, 다른 도구(보내기, 파일 조작 등)와 함께 사용할 때는 작업 확인을 켜 두세요.
- Apple 계정 암호를 바꾸면 App 전용 암호가 모두 무효가 됩니다. 다시 만들어 설정하세요.

## 개발

```bash
npm ci
npm run build
ICLOUD_EMAIL=you@icloud.com ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx npx @modelcontextprotocol/inspector node dist/index.js
```

## 라이선스

MIT
