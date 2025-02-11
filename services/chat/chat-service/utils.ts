import { nanoid } from "nanoid";

export function createTextMessage(params: {
  content: string;
  senderId: string;
}) {
  return {
    direction: "outgoing",
    senderId: params.senderId,
    status: 1,
    id: nanoid(),
    contentType: 0,
    content: params.content,
    createdTime: new Date(),
    updatedTime: null,
  } as const;
}
