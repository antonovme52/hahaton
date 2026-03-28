type VkMethodResponse<T> =
  | { response: T }
  | {
      error: {
        error_code: number;
        error_msg: string;
      };
    };

function randomInt32(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

export async function vkMessagesSend(peerId: number, message: string): Promise<void> {
  const accessToken = process.env.VK_MESSAGES_ACCESS_TOKEN;
  if (!accessToken) {
    return;
  }

  const v = process.env.VK_API_VERSION ?? "5.199";
  const params = new URLSearchParams({
    access_token: accessToken,
    v,
    peer_id: String(peerId),
    message,
    random_id: String(randomInt32())
  });

  const res = await fetch(`https://api.vk.com/method/messages.send?${params.toString()}`);
  if (!res.ok) {
    console.error("[vk] messages.send HTTP", res.status, await res.text());
    return;
  }

  const json = (await res.json()) as VkMethodResponse<number>;
  if ("error" in json) {
    console.error("[vk] messages.send", json.error);
  }
}
