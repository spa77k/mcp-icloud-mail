[日本語](README.md) | [English](README.en.md) | [简体中文](README.zh-CN.md) | [한국어](README.ko.md)

# mcp-icloud-mail

iCloud メールを Claude などの AI から**読むだけ**の MCP サーバーです。IMAP とアプリ用パスワードで接続します。

A read-only MCP server for iCloud Mail over IMAP, using an app-specific password.

## できること

| ツール | 内容 |
| --- | --- |
| `list_mailboxes` | フォルダの一覧と、件数・未読数 |
| `list_messages` | フォルダの新しいメールの一覧（件名・差出人・日時） |
| `search_messages` | 差出人・宛先・件名・本文・期間・未読で検索 |
| `get_message` | 1通の本文（テキスト）と添付ファイル名を読む |

- 送信・削除・移動・既読にする操作はありません。フォルダは読み取り専用で開くので、読んでも未読のままです。
- 添付ファイルの中身は取り出しません（ファイル名・種類・サイズだけ）。

## 準備

1. Apple アカウントで 2 ファクタ認証をオンにする。
2. [account.apple.com](https://account.apple.com) にサインインし、「サインインとセキュリティ」→「App 用パスワード」でパスワードを作る（`xxxx-xxxx-xxxx-xxxx` の形）。
3. Node.js 20 以上を入れる。

## インストール

このパッケージは npm に未公開のため、GitHub から clone してビルドします。

```bash
git clone https://github.com/spa77k/mcp-icloud-mail.git
cd mcp-icloud-mail
npm ci
npm run build
```

ビルドすると `dist/index.js` ができます。設定ではこのファイルを絶対パスで指定します。

## 設定

以下の `/path/to/mcp-icloud-mail` は clone したディレクトリの絶対パス（`pwd` で確認できます）に置き換えてください。環境変数はプレースホルダのままにせず、自分の値に置き換えます。

### Claude Code

```bash
claude mcp add icloud-mail -e ICLOUD_EMAIL=you@icloud.com -e ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx -- node /path/to/mcp-icloud-mail/dist/index.js
```

### Claude Desktop など（JSON で設定するクライアント）

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

| 環境変数 | 内容 |
| --- | --- |
| `ICLOUD_EMAIL` | iCloud メールアドレス（`@icloud.com` / `@me.com` / `@mac.com`） |
| `ICLOUD_APP_PASSWORD` | 準備で作った App 用パスワード |

## 使い方の例

- 「今日届いた未読メールを要約して」
- 「Amazon からの先月のメールを探して」
- 「受信箱の最新10件を一覧にして」

## 注意

- App 用パスワードは iCloud メール・連絡先・カレンダーなどにアクセスできます。設定ファイルを人に見せたり、リポジトリに入れたりしないでください。漏れたら account.apple.com でそのパスワードを取り消してください。
- メール本文はそのまま AI に渡ります。知らない人からのメールに「〇〇を実行して」などの指示が書かれていても、AI がそれに従わないよう、ほかのツール（送信やファイル操作など）と組み合わせるときは操作の確認をオンにしておいてください。
- Apple アカウントのパスワードを変えると、App 用パスワードはすべて無効になります。作り直して設定し直してください。

## 開発

```bash
npm ci
npm run build
ICLOUD_EMAIL=you@icloud.com ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
