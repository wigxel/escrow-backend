import type { Notification } from "~/migrations/schema";

const notificationMessages = {
  cancelOrder: {
    title: "Cancelled order",
    message: "One or more of your orders has been cancelled",
  },
  processOrder: {
    title: "Order in Progress!",
    message:
      "Your order has been received and is currently being processed. We’re working hard to prepare it for you. You’ll receive an update once it’s on its way.",
  },
  shippedOrder: {
    title: "Your Order is En Route!",
    message:
      "Good news! Your order is on its way. We’ll keep you updated on any further changes.",
  },
  orderDeliveredBuyer: {
    title: "Delivery Confirmed!",
    message:
      "Thank you for letting us know! We're glad to hear that your order has arrived.",
  },
  orderDeliveredSeller: {
    title: "Delivery Confirmed for Your Product!",
    message:
      "Great news! The delivery of your product has been successfully confirmed. Thank you for providing excellent service.",
  },
  checkout: {
    title: "Successful checkout",
    message:
      "Thank you for your purchase! Your order has been successfully processed. You will receive a confirmation email shortly with the details of your order.",
  },
  newOrder: {
    title: "New Order",
    message:
      "You have a new order. Please review the details and prepare to fulfill it",
  },
  buyerDispute: {
    title: "Dispute Opened for Your Order",
    message:
      "We’ve received your dispute regarding the recent order. Our team is reviewing the details and will be in touch with updates soon.",
  },
  buyerSellerDispute: {
    title: "Dispute Opened: Buyer Concern",
    message:
      "We want to inform you that the buyer has raised a dispute regarding their recent order. ",
  },
};

export const MessageTags = {
  orderStatus: "OrderStatus",
  orderDispute: "OrderDispute",
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
  orderId: string | undefined;
  triggeredBy: {
    role: "BUYER" | "SELLER";
    id: string;
  };
};
