import { requiredEnv } from "@/lib/utils";

type LineTextMessage = {
  type: "text";
  text: string;
};

type LinePushMessageBody = {
  to: string;
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
