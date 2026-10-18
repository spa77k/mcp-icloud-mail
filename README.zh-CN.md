[日本語](README.md) | [English](README.en.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md)

# mcp-icloud-mail

一个让 Claude 等 AI 工具**只读**访问 iCloud 邮件的 MCP 服务器。它通过 IMAP 和应用专用密码连接。

## 功能

| 工具 | 说明 |
| --- | --- |
| `list_mailboxes` | 列出文件夹，以及邮件数和未读数 |
| `list_messages` | 列出文件夹中较新的邮件（主题、发件人、日期） |
| `search_messages` | 按发件人、收件人、主题、正文、时间段或未读状态搜索 |
| `get_message` | 读取单封邮件的正文（文本）和附件文件名 |

- 不提供发送、删除、移动或标记为已读的操作。文件夹以只读方式打开，因此读取后邮件仍为未读。
- 不提取附件的内容（只有文件名、类型和大小）。

## 准备

1. 为 Apple 账户开启双重认证。
2. 登录 [account.apple.com](https://account.apple.com)，在“登录与安全” → “App 专用密码”中创建密码（格式为 `xxxx-xxxx-xxxx-xxxx`）。
3. 安装 Node.js 20 或更高版本。

## 安装

本包尚未发布到 npm，请从 GitHub 克隆并构建。

```bash
git clone https://github.com/spa77k/mcp-icloud-mail.git
cd mcp-icloud-mail
npm ci
npm run build
```

构建后会生成 `dist/index.js`。配置时请以绝对路径指定这个文件。

## 配置

请把下面的 `/path/to/mcp-icloud-mail` 替换为克隆目录的绝对路径（可以用 `pwd` 查看）。环境变量不要保留占位符，请替换为自己的值。

### Claude Code

```bash
claude mcp add icloud-mail -e ICLOUD_EMAIL=you@icloud.com -e ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx -- node /path/to/mcp-icloud-mail/dist/index.js
```

### Claude Desktop 等（通过 JSON 配置的客户端）

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

| 环境变量 | 说明 |
| --- | --- |
| `ICLOUD_EMAIL` | iCloud 邮箱地址（`@icloud.com` / `@me.com` / `@mac.com`） |
| `ICLOUD_APP_PASSWORD` | 在准备步骤中创建的 App 专用密码 |

## 使用示例

- “帮我把今天收到的未读邮件总结一下。”
- “找出 Amazon 上个月发来的邮件。”
- “列出收件箱里最新的 10 封邮件。”

## 注意事项

- App 专用密码可以访问 iCloud 邮件、通讯录、日历等。请不要把配置文件给别人看，也不要提交到仓库。如果泄露，请在 account.apple.com 撤销该密码。
- 邮件正文会原样传给 AI。即使陌生人的邮件中写有“执行某某”之类的指令，在与其他工具（发送、文件操作等）配合使用时，也请开启操作确认，以免 AI 听从这些指令。
- 更改 Apple 账户密码会使所有 App 专用密码失效。请重新创建并重新配置。

## 开发

```bash
npm ci
npm run build
ICLOUD_EMAIL=you@icloud.com ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx npx @modelcontextprotocol/inspector node dist/index.js
```

## 许可证

MIT
