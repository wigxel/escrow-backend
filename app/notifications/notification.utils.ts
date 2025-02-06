import type { Notification } from "~/migrations/schema";

const notificationMessages = {
  createdDispute: {
    title: "",
    message:
      "",
  },
  openedDisputeForOther: {
    title: "Dispute Opened: Customer's Concern",
    message:
      "We want to inform you that the customer has raised a dispute regarding their recent escrow with you. ",
  },
};

export const MessageTags = {
  escrowDispute: "EscrowDispute",
  notification: "notification",
  checkout: "checkout",
};

export class NotificationSetup {
  private messageType: typeof notificationMessages;
  private Tag: string;
  constructor(tag: keyof typeof MessageTags) {
    this.messageType = notificationMessages;
    this.Tag = MessageTags[tag];
  }

  /**
   * @param v.name the name of a predefined notification message
   */
  createMessage(
    v:
      | {
          type: "preset";
          name: TNotificationMsg;
          meta: TNotificationMeta;
          receiverId?: string;
        }
      | {
          type: "new";
          msg: TNotificationMessage;
          receiverId?: string;
        },
  ) {
    let obj = {};
    let msg: TNotificationMessage;
    if (v.type === "preset") {
      msg = this.messageType[v.name];
      //stringify meta
      const meta = JSON.stringify(v.meta);
      obj = {
        tag: this.Tag,
        userId: v.receiverId ? v.receiverId : v.meta.triggeredBy.id,
        ...msg,
        meta,
      };
    } else {
      obj = { tag: this.Tag, userId: v.receiverId, ...v.msg };
    }

    return obj;
  }

  static unserializeNotification(notifications: Notification[]) {
    if (!notifications.length) return [];
    const result: Notification[] = [];
    for (const notification of notifications) {
      result.push({ ...notification, meta: JSON.parse(notification.meta) });
    }

    return result;
  }
}

export type TNotificationMsg = keyof typeof notificationMessages;
export type TNotificationMessage = { title: string; message: string };
export type TNotificationMeta = {
  escrowId: string | undefined;
  triggeredBy: {
    role: "BUYER" | "SELLER";
    id: string;
  };
};
