import cuid2, { isCuid } from "@paralleldrive/cuid2";
import { Effect } from "effect";
import { head } from "effect/Array";
import { NoSuchElementException } from "effect/Cause";
import { randomUUID } from "uncrypto";
import type { z } from "zod";
import { CheckoutSuccessfulMail } from "~/app/mail/checkout-successful";
import { NotificationSetup } from "~/app/notifications/notification.utils";
import { OrderCancelledNotification } from "~/app/notifications/order-cancelled";
import { CheckoutModule } from "~/config/app";
import { ExpectedError } from "~/config/exceptions";
import type { TCartItem } from "~/dto/checkout.dto";
import type {
  IOrderDetails,
  buyerUpdateSchema,
  sellerUpdateSchema,
} from "~/dto/order.dto";
import { Mail } from "~/layers/mailing/mail";
import { NotificationFacade } from "~/layers/notification/layer";
import type { TOrderDetail, TOrderItem } from "~/migrations/schema";
import { CartRepo } from "~/repositories/cart.repository";
import { CheckoutStoreRepo } from "~/repositories/checkout-store.repo";
import {
  OrderShippingLayer,
  OrderShippingRepo,
} from "~/repositories/order-shipping.repository";
import { OrderRepo, OrderRepoLayer } from "~/repositories/order.repository";
import { OrderCancellationRepoLayer } from "~/repositories/orderCancellation.repo";
import { OrderItemsRepo } from "~/repositories/orderItems.repository";
import {
  OrderStatusHistoryRepo,
  OrderStatusHistoryRepoLayer,
} from "~/repositories/orderStatusHistory.repo";
import {
  PaymentOrderRepo,
  PaymentOrderRepoLayer,
} from "~/repositories/payment-order.repository";
import {
  PaymentRepo,
  PaymentRepoLayer,
} from "~/repositories/payment.repository";
import { ProductRepoLayer } from "~/repositories/product.repository";
import { UserRepo } from "~/repositories/user.repository";
import { canTransitionOrderStatus } from "~/utils/order.utils";
import { sendNotification } from "./notification.service";
import { adjustStock as adjustStockCount } from "./product.service";
import { searchByRepoWhere } from "./search";
import { SearchOps } from "./search/sql-search-resolver";

const generateOrderId = cuid2.init({ length: 8 });
const notifyHelper = new NotificationSetup("orderStatus");

export const getOrders = (
  currentUserId: string,
  column: "buyerId" | "sellerId",
) => {
  return Effect.gen(function* (_) {
    const orderRepo = yield* OrderRepoLayer.Tag;

    // get the buyer/seller's orders
    // @ts-expect-error
    const orders = yield* searchByRepoWhere(orderRepo, () => ({
      where: SearchOps.eq(column, currentUserId),
    }));

    return orders;
  });
};

export const getOrderById = (params: {
  orderId: string;
  userId: string;
  type: "buyer" | "seller";
}) => {
  return Effect.gen(function* (_) {
    const orderRepo = yield* OrderRepoLayer.Tag;
    const filter = isCuid(params.orderId)
      ? SearchOps.eq("reference", params.orderId)
      : SearchOps.eq("id", params.orderId);

    const orders = yield* orderRepo.findFullInfo(filter);

    return { data: orders, status: true };
  });
};

/** I feel there's a need to break this function into small bits */
export const updateOrderStatus = (v: {
  orderId: string;
  userId: string;
  userRole: "buyer" | "seller";
  data: z.infer<typeof buyerUpdateSchema> | z.infer<typeof sellerUpdateSchema>;
}) => {
  return Effect.gen(function* (_) {
    const orderRepo = yield* OrderRepoLayer.Tag;
    const orderHistoryRepo = yield* OrderStatusHistoryRepoLayer.Tag;
    const orderDeliveryRepo = yield* OrderShippingLayer.Tag;

    const userColumn = v.userRole === "seller" ? "sellerId" : "buyerId";

    yield* Effect.logDebug(
      `Get the order by id (${v.orderId}) userId(${v.userId})`,
    );
    // get the order by id
    const orderDetails = yield* _(
      orderRepo.getSingleOrder({
        id: v.orderId,
        [userColumn]: v.userId,
      }),
      Effect.mapError((err) => {
        if (err instanceof NoSuchElementException) {
          return new ExpectedError("Invalid Order ID");
        }
        return err;
      }),
    );

    const paymentDetails = orderDetails.paymentDetails;

    yield* Effect.logDebug(
      `Get the order by id (${v.orderId}) userId(${v.userId})`,
    );

    if (!(paymentDetails?.status === "success")) {
      yield* new ExpectedError("Payment not yet verified");
    }

    // make sure the order status moves only forward before updating it
    const canUpdateOrderStatus = canTransitionOrderStatus(
      orderDetails.shipping.deliveryType,
      orderDetails.status,
      v.data.status,
    );

    if (!canUpdateOrderStatus) {
      return yield* new ExpectedError(
        `Cannot transition from ${orderDetails.status} to ${v.data.status}`,
      );
    }

    // check if the order is being cancelled
    if (v.data.status === "cancelled") {
      return yield* cancelOrder({
        orderDetails,
        actionBy: userColumn,
        currentUserId: v.userId,
        reason: v.data?.reason,
      });
    }

    // update the order status
    yield* orderRepo.update(
      { id: v.orderId, [userColumn]: v.userId },
      { status: v.data.status },
    );

    // add new order status entry
    yield* orderHistoryRepo.create({
      orderId: orderDetails.id,
      status: v.data.status,
      changedBy: v.userId,
    });

    // send in-app notification based on updated order status
    if (v.data.status === "processing") {
      yield* sendNotification(
        notifyHelper.createMessage({
          type: "preset",
          name: "processOrder",
          receiverId: orderDetails.buyerId,
          meta: {
            orderId: orderDetails.id,
            triggeredBy: {
              id: orderDetails.sellerId,
              role: "SELLER",
            },
          },
        }),
      );
    }

    if (v.data.status === "shipped") {
      // update the shipping details table
      yield* orderDeliveryRepo.update(
        { orderId: orderDetails.id },
        { deliveryStatus: "shipped" },
      );

      yield* sendNotification(
        notifyHelper.createMessage({
          type: "preset",
          name: "shippedOrder",
          receiverId: orderDetails.buyerId,
          meta: {
            orderId: orderDetails.id,
            triggeredBy: {
              id: orderDetails.sellerId,
              role: "SELLER",
            },
          },
        }),
      );
    }

    if (v.data.status === "delivered") {
      // update the shipping details table
      yield* orderDeliveryRepo.update(
        { orderId: orderDetails.id },
        { deliveryStatus: "delivered" },
      );

      yield* Effect.all([
        //send to the buyer
        sendNotification(
          notifyHelper.createMessage({
            type: "preset",
            name: "orderDeliveredBuyer",
            receiverId: orderDetails.buyerId,
            meta: {
              orderId: orderDetails.id,
              triggeredBy: {
                id: orderDetails.buyerId,
                role: "BUYER",
              },
            },
          }),
        ), //send to the seller
        sendNotification(
          notifyHelper.createMessage({
            type: "preset",
            name: "orderDeliveredSeller",
            receiverId: orderDetails.sellerId,
            meta: {
              orderId: orderDetails.id,
              triggeredBy: {
                id: orderDetails.buyerId,
                role: "BUYER",
              },
            },
          }),
        ),
      ]);
    }

    return {
      status: true,
    };
  });
};

export const cancelOrder = (params: {
  orderDetails: IOrderDetails;
  actionBy: "sellerId" | "buyerId";
  currentUserId: string;
  reason?: string;
}) => {
  const { orderDetails, actionBy, currentUserId, reason } = params;

  return Effect.gen(function* () {
    const notify = yield* NotificationFacade;
    const userRepo = yield* UserRepo;

    const orderRepo = yield* OrderRepoLayer.Tag;
    const prodRepo = yield* ProductRepoLayer.Tag;
    const cancelOrderRepo = yield* OrderCancellationRepoLayer.Tag;
    const orderStatusRepo = yield* OrderStatusHistoryRepoLayer.Tag;
    const notifySetup = new NotificationSetup("orderStatus");

    const updatedData: TOrderDetail = {
      status: "cancelled",
    };

    // update the order
    yield* orderRepo.update(
      {
        id: orderDetails.id,
        [actionBy]: currentUserId,
      },
      updatedData,
    );

    //new order status entry
    yield* orderStatusRepo.create({
      orderId: orderDetails.id,
      changedBy: currentUserId,
      status: "cancelled",
    });

    // new cancel order entry
    yield* cancelOrderRepo.create({
      orderId: orderDetails.id,
      cancelledBy: currentUserId,
      cancelReason: reason,
    });

    // increment the stock of each product in the order
    const orderItems = orderDetails.orderItems as TOrderItem[];

    for (const items of orderItems) {
      //get the product details
      const productDetails = yield* prodRepo
        .firstOrThrow(items.productId, orderDetails.sellerId)
        .pipe(Effect.mapError(() => new ExpectedError("Product not found")));

      yield* prodRepo.update(
        { ownerId: orderDetails.sellerId, id: items.productId },
        {
          stock: productDetails.stock + 1,
        },
      );
    }

    //send notification to both buyer and seller the user cancelling
    const receivers = [orderDetails.sellerId, orderDetails.buyerId];

    for (const receiverId of receivers) {
      yield* sendNotification(
        notifySetup.createMessage({
          type: "preset",
          name: "cancelOrder",
          receiverId: receiverId,
          meta: {
            orderId: orderDetails.id,
            triggeredBy: {
              id: currentUserId,
              role: actionBy === "buyerId" ? "BUYER" : "SELLER",
            },
          },
        }),
      );
    }

    const [user, seller] = yield* Effect.all([
      userRepo.find(orderDetails.buyerId),
      userRepo.find(orderDetails.sellerId),
    ]);

    yield* notify
      .route("mail", { address: user.email })
      .route("mail", { address: seller.email })
      .notify(new OrderCancelledNotification(user));

    return { status: true, message: "The order has been cancelled" };
  });
};

export const updateOrderPayment = (orderId: string, status: string) => {
  return Effect.gen(function* () {
    const paymentOrderRepo = yield* PaymentOrderRepoLayer.Tag;
    const paymentDetailsRepo = yield* PaymentRepoLayer.Tag;

    const payment = yield* paymentOrderRepo
      .firstOrThrow(SearchOps.eq("orderId", orderId))
      .pipe(
        Effect.mapError(
          () => new ExpectedError("no payment details for this order"),
        ),
      );

    // update order payment details to success
    const [r] = yield* paymentDetailsRepo.update(payment.paymentId, {
      status: status,
    });

    return { status: true, r };
  });
};

export function createOrderFromCheckoutReference(payload: {
  checkoutRef: string;
}) {
  return Effect.gen(function* () {
    yield* Effect.logDebug(
      `Creating order from reference (${payload.checkoutRef})`,
    );

    const mail = yield* Mail;
    const cartRepo = yield* CartRepo;
    const userRepo = yield* UserRepo;
    const checkoutRepo = yield* CheckoutStoreRepo;

    const checkoutInfo = yield* checkoutRepo.find(payload.checkoutRef);

    if (checkoutInfo.status !== "waiting") {
      yield* new ExpectedError("Checkout already processed");
    }

    const cartWithItems = yield* cartRepo.findWithItems(
      checkoutInfo.cartSessionId,
    );

    const orderDetails = yield* createOrder({
      buyerId: checkoutInfo.userId,
      products: cartWithItems.items,
      deliveryInfo: {
        type: checkoutInfo.deliveryType,
        // @ts-expect-error
        addressId: checkoutInfo.metadata?.addressId,
      },
    });

    const user = yield* userRepo.find(checkoutInfo.userId);

    yield* Effect.logDebug(
      `Constructing notifications (${payload.checkoutRef})`,
    );

    const sendOrderNotifications = orderDetails.flatMap((order) => {
      return [
        // send in app notification to buyer
        sendNotification(
          notifyHelper.createMessage({
            type: "preset",
            name: "checkout",
            receiverId: user.id,
            meta: {
              orderId: order.id,
              triggeredBy: { role: "BUYER", id: user.id },
            },
          }),
        ),

        // send in-app notification to the seller
        sendNotification(
          notifyHelper.createMessage({
            type: "preset",
            name: "newOrder",
            receiverId: order.sellerId,
            meta: {
              orderId: order.id,
              triggeredBy: { role: "BUYER", id: user.id },
            },
          }),
        ),
      ];
    });

    // send email
    const doSendMail = mail
      .to([user.email, user.firstName])
      .send(new CheckoutSuccessfulMail());

    yield* Effect.logDebug(`Dispatch notifications (${payload.checkoutRef})`);
    yield* Effect.all([doSendMail, ...sendOrderNotifications], {
      concurrency: 8,
    });

    yield* Effect.logDebug(
      `Mark checkout tx as processed (${payload.checkoutRef})`,
    );
    yield* checkoutRepo.update(
      { reference: checkoutInfo.reference },
      {
        status: "processed" as const,
      },
    );
  }).pipe(Effect.provide(CheckoutModule));
}

function createOrder(params: {
  buyerId: string;
  products: Pick<TCartItem, "productDetails" | "productId" | "quantity">[];
  deliveryInfo: { type: string; addressId: string };
}) {
  return Effect.gen(function* () {
    const paymentRepo = yield* PaymentRepo;
    const paymentOrderRepo = yield* PaymentOrderRepo;

    const totalCost = calculateOrderTotalPrice(params.products);

    const payment = yield* paymentRepo
      .create({
        amount: String(totalCost),
        paymentType: "card",
        status: "success",
      })
      .pipe(Effect.flatMap(head));

    const paymentId = payment.paymentId;

    const items = params.products.map((item) => {
      return Effect.gen(function* () {
        const orderRepo = yield* OrderRepo;
        const orderItemRepo = yield* OrderItemsRepo;
        const deliveryRepo = yield* OrderShippingRepo;
        const orderHistory = yield* OrderStatusHistoryRepo;

        const orderId = randomUUID();

        // create order
        const orderDetails = yield* orderRepo
          .create({
            id: orderId,
            status: "pending",
            paymentId: paymentId,
            buyerId: params.buyerId,
            reference: generateOrderId(),
            total: String(totalCost),
            sellerId: item.productDetails.ownerId,
          })
          .pipe(Effect.flatMap(head));

        yield* Effect.all(
          [
            // create a delivery record
            deliveryRepo.create({
              orderId: orderId,
              deliveryType: params.deliveryInfo.type,
              addressId: params.deliveryInfo?.addressId ?? undefined,
            }),
            orderHistory.create({
              orderId: orderId,
              status: "pending",
              changedBy: params.buyerId,
            }),
            paymentOrderRepo.create({
              orderId: orderId,
              paymentId: paymentId,
            }),
            // add items to the order
            orderItemRepo.create({
              orderId: orderId,
              productId: item.productId,
              quantity: item.quantity,
              price: item.productDetails.price,
            }),
            // create adjust stock price
            adjustStockCount({
              productId: item.productId,
              ownerId: orderDetails.sellerId,
              value: -1,
            }),
          ],
          { concurrency: "unbounded" },
        );

        return orderDetails;
      });
    });

    const orderDetails = yield* Effect.all(items, { concurrency: 2 });

    return orderDetails;
  });
}
