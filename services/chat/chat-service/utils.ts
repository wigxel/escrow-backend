import { nanoid } from "nanoid";

export function createTextMessage(params: {
  content: string;
  senderId: string;
  type?: "text" | "image" | "video";
}) {
  return {
    direction: "outgoing",
    senderId: params.senderId,
    status: 1,
    id: nanoid(),
    type: params.type ? params.type : "text",
    contentType: 0,
    content: params.content,
    createdTime: new Date(),
    updatedTime: null,
  } as const;
}
