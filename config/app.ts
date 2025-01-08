// import { DevTools } from "@effect/experimental";
import { Config, Effect, Layer } from "effect";
import { AuthLive } from "~/layers/auth-user";
import { DatabaseLive } from "~/layers/database";
import { Mailer } from "~/layers/mailing";
import { MailLive } from "~/layers/mailing/mail";
import { NotificationLive } from "~/layers/notification/layer";
import { StripeCheckoutLive } from "~/layers/payment/adapters/stripe";
import { StripeEventLive } from "~/layers/payment/adapters/stripe-events";
import { CartRepoLayer } from "~/repositories/cart.repository";
import { CartItemsRepoLayer } from "~/repositories/cartItems.repository";
import { CategoryRepoLive } from "~/repositories/category.repo";
import { CheckoutStoreRepoLive } from "~/repositories/checkout-store.repo";
import { DisputeRepoLayer } from "~/repositories/dispute.repo";
import { DisputeMembersRepoLayer } from "~/repositories/disputeMember.repo";
import { DisputeMessagesRepoLayer } from "~/repositories/disputeMessage.repo";
import { DisputeReadReceiptRepoLayer } from "~/repositories/disputeReadReceipt.repo";
import { NotificationRepoLayer } from "~/repositories/notification.repo";
import { OrderShippingLayer } from "~/repositories/order-shipping.repository";
import { OrderRepoLayer } from "~/repositories/order.repository";
import { OrderCancellationRepoLayer } from "~/repositories/orderCancellation.repo";
import { OrderItemsRepoLayer } from "~/repositories/orderItems.repository";
import { OrderStatusHistoryRepoLayer } from "~/repositories/orderStatusHistory.repo";
import { PaymentOrderRepoLayer } from "~/repositories/payment-order.repository";
import { PaymentRepoLayer } from "~/repositories/payment.repository";
import { ProductRepoLayer } from "~/repositories/product.repository";
import { ProductImageRepoLayer } from "~/repositories/productImage.repository";
import { ReviewRepoLive } from "~/repositories/review.repository";
import { UserRepoLayer } from "~/repositories/user.repository";
import { UserLocationRepoLive } from "~/repositories/userLocation.repo";
import { ChatServiceLive } from "~/services/chat/dispute";
import { SESMailer } from "~/services/mailing/aws-ses";
import { NodeMailer } from "~/services/mailing/node-mailer";
import { LogDebugLayer } from "./logger";

const ReviewService = Layer.empty.pipe(Layer.provideMerge(ReviewRepoLive));

const ProductModule = Layer.empty.pipe(
  Layer.provideMerge(ProductRepoLayer.Repo.Live),
  Layer.provideMerge(ProductImageRepoLayer.Repo.Live),
  Layer.provideMerge(CategoryRepoLive),
);

const DisputeModule = Layer.empty.pipe(
  Layer.provideMerge(DisputeRepoLayer.Repo.Live),
  Layer.provideMerge(DisputeMembersRepoLayer.Repo.Live),
  Layer.provideMerge(DisputeMessagesRepoLayer.Repo.Live),
  Layer.provideMerge(DisputeReadReceiptRepoLayer.Repo.Live),
  Layer.provideMerge(ChatServiceLive),
);

const CartModule = Layer.empty.pipe(
  Layer.provideMerge(CartRepoLayer.Repo.Live),
  Layer.provideMerge(CartItemsRepoLayer.Repo.Live),
  Layer.provideMerge(CartItemsRepoLayer.Repo.Live),
);

export const CheckoutModule = Layer.empty.pipe(
  Layer.provideMerge(CheckoutStoreRepoLive),
  Layer.provideMerge(StripeCheckoutLive),
  Layer.provideMerge(StripeEventLive),
);

const OrderModule = Layer.empty.pipe(
  Layer.provideMerge(OrderRepoLayer.Repo.Live),
  Layer.provideMerge(OrderItemsRepoLayer.Repo.Live),
  Layer.provideMerge(OrderStatusHistoryRepoLayer.Repo.Live),
  Layer.provideMerge(OrderCancellationRepoLayer.Repo.Live),
  Layer.provideMerge(OrderShippingLayer.Repo.Live),
);

const MailerLive = Layer.effect(
  Mailer,
  Effect.gen(function* (_) {
    const app_env = yield* Config.string("APP_ENV");
    if (app_env === "production") return new SESMailer();
    return new NodeMailer();
  }),
);

export const MailingModule = Layer.empty.pipe(
  Layer.provideMerge(NotificationLive),
  Layer.provideMerge(MailLive),
  Layer.provideMerge(MailerLive),
);

export const PaymentModule = Layer.empty.pipe(
  Layer.provideMerge(PaymentRepoLayer.Repo.Live),
  Layer.provideMerge(PaymentOrderRepoLayer.Repo.Live),
);

export const UserModule = Layer.empty.pipe(
  Layer.provideMerge(UserLocationRepoLive),
  Layer.provideMerge(UserRepoLayer.Repo.Live),
);

export const AppLive = Layer.empty.pipe(
  Layer.provideMerge(DatabaseLive),
  Layer.provideMerge(LogDebugLayer),
  Layer.provideMerge(AuthLive),
  Layer.provideMerge(DisputeModule),
  Layer.provideMerge(MailingModule),
  Layer.provideMerge(CartModule),
  Layer.provideMerge(OrderModule),
  Layer.provideMerge(ProductModule),
  Layer.provideMerge(ReviewService),
  Layer.provideMerge(PaymentModule),
  Layer.provideMerge(NotificationRepoLayer.Repo.Live),
  Layer.provideMerge(UserModule),
);

// const DevToolsLive = DevTools.layerWebSocket().pipe(
//   Layer.provide(NodeSocket.layerWebSocketConstructor),
// );
