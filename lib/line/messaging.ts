import { requiredEnv } from "@/lib/utils";

type LineTextMessage = {
  type: "text";
  text: string;
};

type LinePushMessageBody = {
  to: string;
  messages: LineTextMessage[];
};

type LineBroadcastMessageBody = {
  messages: LineTextMessage[];
};

export async function pushLineTextMessage(to: string, text: string) {
  const channelAccessToken = requiredEnv("LINE_CHANNEL_ACCESS_TOKEN");

  const body: LinePushMessageBody = {
    to,
    messages: [
      {
        type: "text",
        text,
      },
    ],
  };

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LINE push message failed with status ${response.status}: ${errorText}`,
    );
  }
}

export async function broadcastLineTextMessage(text: string) {
  const channelAccessToken = requiredEnv("LINE_CHANNEL_ACCESS_TOKEN");

  const body: LineBroadcastMessageBody = {
    messages: [
      {
        type: "text",
        text,
      },
    ],
  };

  const response = await fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
      "X-Line-Retry-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const lineRequestId = response.headers.get("x-line-request-id");

    throw new Error(
      `LINE broadcast message failed with status ${response.status}, request id ${lineRequestId ?? "-"}: ${errorText}`,
    );
  }
}

export const LINE_MULTICAST_MAX_RECIPIENTS = 500;

export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0 || items.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

type LineMulticastMessageBody = {
  to: string[];
  messages: LineTextMessage[];
};

export async function multicastLineTextMessage(
  recipients: string[],
  text: string,
) {
  if (recipients.length === 0) {
    return;
  }

  const channelAccessToken = requiredEnv("LINE_CHANNEL_ACCESS_TOKEN");
  const chunks = chunkArray(recipients, LINE_MULTICAST_MAX_RECIPIENTS);

  for (const chunk of chunks) {
    const body: LineMulticastMessageBody = {
      to: chunk,
      messages: [
        {
          type: "text",
          text,
        },
      ],
    };

    const response = await fetch("https://api.line.me/v2/bot/message/multicast", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channelAccessToken}`,
        "Content-Type": "application/json",
        "X-Line-Retry-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const lineRequestId = response.headers.get("x-line-request-id");

      throw new Error(
        `LINE multicast message failed with status ${response.status}, request id ${lineRequestId ?? "-"}: ${errorText}`,
      );
    }
  }
}

