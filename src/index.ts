#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ImapFlow, type SearchObject } from "imapflow";
import { simpleParser } from "mailparser";
import { z } from "zod";

const EMAIL = process.env.ICLOUD_EMAIL;
const APP_PASSWORD = process.env.ICLOUD_APP_PASSWORD;

if (!EMAIL || !APP_PASSWORD) {
  console.error(
    "ICLOUD_EMAIL and ICLOUD_APP_PASSWORD must be set. " +
      "Create an app-specific password at https://account.apple.com (Sign-In and Security > App-Specific Passwords).",
  );
  process.exit(1);
}

// Opens a fresh IMAP connection for each tool call and always opens the
// mailbox read-only, so this server never changes flags (e.g. "seen").
async function withMailbox<T>(
  mailbox: string | null,
  fn: (client: ImapFlow) => Promise<T>,
): Promise<T> {
  const client = new ImapFlow({
    host: "imap.mail.me.com",
    port: 993,
    secure: true,
    auth: { user: EMAIL!, pass: APP_PASSWORD! },
    logger: false,
  });
  try {
    await client.connect();
  } catch (err) {
    const e = err as { authenticationFailed?: boolean; responseText?: string; message?: string };
    if (e.authenticationFailed) {
      throw new Error(
        "iCloud login failed. Check ICLOUD_EMAIL and ICLOUD_APP_PASSWORD (it must be an app-specific password, not your Apple Account password).",
      );
    }
    throw new Error(`Could not connect to imap.mail.me.com: ${e.responseText ?? e.message ?? String(err)}`);
  }
  try {
    if (mailbox === null) return await fn(client);
    const lock = await client.getMailboxLock(mailbox, { readOnly: true });
    try {
      return await fn(client);
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
}

type Summary = {
  uid: number;
  date: string | null;
  from: string;
  to: string;
  subject: string;
  seen: boolean;
  size: number | undefined;
};

function formatAddresses(list?: { name?: string; address?: string }[]): string {
  return (list ?? [])
    .map((a) => (a.name ? `${a.name} <${a.address ?? ""}>` : (a.address ?? "")))
    .join(", ");
}

async function summarize(client: ImapFlow, uids: number[]): Promise<Summary[]> {
  if (uids.length === 0) return [];
  const out: Summary[] = [];
  for await (const msg of client.fetch(
    uids,
    { uid: true, envelope: true, flags: true, internalDate: true, size: true },
    { uid: true },
  )) {
    const date = msg.envelope?.date ?? msg.internalDate;
    out.push({
      uid: msg.uid,
      date: date ? new Date(date).toISOString() : null,
      from: formatAddresses(msg.envelope?.from),
      to: formatAddresses(msg.envelope?.to),
      subject: msg.envelope?.subject ?? "",
      seen: msg.flags?.has("\\Seen") ?? false,
      size: msg.size,
    });
  }
  return out.sort((a, b) => b.uid - a.uid);
}

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const server = new McpServer({ name: "mcp-icloud-mail", version: "0.1.0" });

server.registerTool(
  "list_mailboxes",
  {
    description: "List all iCloud Mail mailboxes (folders) with message and unread counts.",
    annotations: { readOnlyHint: true },
  },
  async () =>
    json(
      await withMailbox(null, async (client) => {
        const boxes = await client.list({ statusQuery: { messages: true, unseen: true } });
        return boxes.map((b) => ({
          path: b.path,
          specialUse: b.specialUse ?? null,
          messages: b.status?.messages,
          unseen: b.status?.unseen,
        }));
      }),
    ),
);

server.registerTool(
  "list_messages",
  {
    description: "List the most recent messages in a mailbox (newest first). Returns headers only.",
    inputSchema: {
      mailbox: z.string().default("INBOX").describe("Mailbox path, e.g. INBOX"),
      limit: z.number().int().min(1).max(100).default(20),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ mailbox, limit }) =>
    json(
      await withMailbox(mailbox, async (client) => {
        const uids = (await client.search({ all: true }, { uid: true })) || [];
        return summarize(client, uids.slice(-limit));
      }),
    ),
);

server.registerTool(
  "search_messages",
  {
    description:
      "Search messages in a mailbox. All conditions are combined with AND. Returns headers only, newest first.",
    inputSchema: {
      mailbox: z.string().default("INBOX"),
      from: z.string().optional().describe("Sender address or name contains"),
      to: z.string().optional().describe("Recipient address or name contains"),
      subject: z.string().optional().describe("Subject contains"),
      text: z.string().optional().describe("Headers or body contains"),
      since: z.string().optional().describe("On or after this date (YYYY-MM-DD)"),
      before: z.string().optional().describe("Before this date (YYYY-MM-DD)"),
      unread: z.boolean().optional().describe("true: unread only, false: read only"),
      limit: z.number().int().min(1).max(100).default(20),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ mailbox, from, to, subject, text, since, before, unread, limit }) =>
    json(
      await withMailbox(mailbox, async (client) => {
        const query: SearchObject = {};
        if (from) query.from = from;
        if (to) query.to = to;
        if (subject) query.subject = subject;
        if (text) query.text = text;
        if (since) query.since = new Date(since);
        if (before) query.before = new Date(before);
        if (unread !== undefined) query.seen = !unread;
        if (Object.keys(query).length === 0) query.all = true;
        const uids = (await client.search(query, { uid: true })) || [];
        return summarize(client, uids.slice(-limit));
      }),
    ),
);

server.registerTool(
  "get_message",
  {
    description:
      "Read one message by UID: headers, plain-text body and attachment list. Does not mark it as read.",
    inputSchema: {
      mailbox: z.string().default("INBOX"),
      uid: z.number().int().positive(),
      maxChars: z
        .number()
        .int()
        .min(500)
        .max(200000)
        .default(20000)
        .describe("Truncate the body to this many characters"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ mailbox, uid, maxChars }) => {
    const result = await withMailbox(mailbox, async (client) => {
      const msg = await client.fetchOne(String(uid), { uid: true, source: true, flags: true }, { uid: true });
      if (!msg || !msg.source) return null;
      const parsed = await simpleParser(msg.source);
      const body = parsed.text?.trim() || (parsed.html ? stripHtml(parsed.html) : "");
      const to = Array.isArray(parsed.to) ? parsed.to.map((a) => a.text).join(", ") : (parsed.to?.text ?? "");
      return {
        uid: msg.uid,
        messageId: parsed.messageId ?? null,
        date: parsed.date?.toISOString() ?? null,
        from: parsed.from?.text ?? "",
        to,
        cc: Array.isArray(parsed.cc) ? parsed.cc.map((a) => a.text).join(", ") : (parsed.cc?.text ?? ""),
        subject: parsed.subject ?? "",
        seen: msg.flags?.has("\\Seen") ?? false,
        body: body.length > maxChars ? body.slice(0, maxChars) + "\n…[truncated]" : body,
        attachments: parsed.attachments.map((a) => ({
          filename: a.filename ?? null,
          contentType: a.contentType,
          size: a.size,
        })),
      };
    });
    if (!result) {
      return { content: [{ type: "text" as const, text: `No message with UID ${uid} in ${mailbox}.` }], isError: true };
    }
    return json(result);
  },
);

await server.connect(new StdioServerTransport());
