[日本語](README.md) | [English](README.en.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md)

# mcp-icloud-mail

A **read-only** MCP server that lets Claude and other AI tools read iCloud Mail. It connects over IMAP with an app-specific password.

## What it can do

| Tool | Description |
| --- | --- |
| `list_mailboxes` | List folders with message and unread counts |
| `list_messages` | List the recent messages in a folder (subject, sender, date) |
| `search_messages` | Search by sender, recipient, subject, body, period, or unread status |
| `get_message` | Read one message body (text) and its attachment file names |

- There are no operations to send, delete, move, or mark messages as read. Folders are opened read-only, so reading a message leaves it unread.
- Attachment contents are not extracted (only file names, types, and sizes).

## Preparation

1. Turn on two-factor authentication for your Apple account.
2. Sign in at [account.apple.com](https://account.apple.com), then create a password under "Sign-In and Security" → "App-Specific Passwords" (in the form `xxxx-xxxx-xxxx-xxxx`).
3. Install Node.js 20 or later.

## Installation

This package is not published on npm, so clone it from GitHub and build it.

```bash
git clone https://github.com/spa77k/mcp-icloud-mail.git
cd mcp-icloud-mail
npm ci
npm run build
```

The build produces `dist/index.js`. In your configuration, specify this file by its absolute path.

## Configuration

Replace `/path/to/mcp-icloud-mail` below with the absolute path of the cloned directory (you can check it with `pwd`). Do not leave the environment variables as placeholders; replace them with your own values.

### Claude Code

```bash
claude mcp add icloud-mail -e ICLOUD_EMAIL=you@icloud.com -e ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx -- node /path/to/mcp-icloud-mail/dist/index.js
```

### Claude Desktop and other JSON-configured clients

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

| Environment variable | Description |
| --- | --- |
| `ICLOUD_EMAIL` | Your iCloud email address (`@icloud.com` / `@me.com` / `@mac.com`) |
| `ICLOUD_APP_PASSWORD` | The app-specific password you created during preparation |

## Example prompts

- "Summarize the unread messages that arrived today."
- "Find last month's messages from Amazon."
- "List the 10 most recent messages in my inbox."

## Cautions

- An app-specific password can access iCloud Mail, Contacts, Calendars, and more. Do not show your configuration file to others or commit it to a repository. If it leaks, revoke that password at account.apple.com.
- Message bodies are passed to the AI as they are. Even if a message from an unknown sender contains instructions such as "run X", enable operation confirmation when you combine this server with other tools (sending mail, file operations, and so on) so that the AI does not follow them.
- Changing your Apple account password invalidates all app-specific passwords. Create a new one and configure it again.

## Development

```bash
npm ci
npm run build
ICLOUD_EMAIL=you@icloud.com ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
