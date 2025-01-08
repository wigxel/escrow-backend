import { Effect } from "effect";

import { toLower } from "ramda";
import { hashPassword } from "~/layers/encryption/helpers";
import type {
  Comment,
  Product,
  reviewsTable,
  userTable,
} from "~/migrations/schema";
import { createFactory } from "~/migrations/seeds/setup";
import { CartItemsRepo } from "~/repositories/cartItems.repository";
import { CommentRepo } from "~/repositories/comment.repository";
import { OrderRepo } from "~/repositories/order.repository";
import { OrderItemsRepo } from "~/repositories/orderItems.repository";
import { ProductRepo } from "~/repositories/product.repository";
import { ReviewRepo } from "~/repositories/review.repository";
import { UserRepo } from "~/repositories/user.repository";
import { UserLocationRepo } from "~/repositories/userLocation.repo";

export const generatePassword = hashPassword("helloman");

export const UserFactory = createFactory(UserRepo, ($faker) => {
  return Effect.gen(function* (_) {
    const password = yield* generatePassword;

    return {
      firstName: $faker.person.firstName(),
      lastName: $faker.person.lastName(),
      email: toLower($faker.internet.email()),
      emailVerified: $faker.helpers.arrayElement([true, false]),
      password: password,
      phone: $faker.phone.number(),
      createdAt: $faker.date.past(),
      role: $faker.helpers.arrayElement(["BUYER", "SELLER"]),
    } satisfies typeof userTable.$inferInsert;
  });
});

export const ProductFactory = createFactory(ProductRepo, ($faker) => {
  return Effect.gen(function* (_) {
    yield* Effect.succeed(1);

    const data: Product = {
      availability: $faker.datatype.boolean(),
      categoryId: $faker.helpers.arrayElement([1, 2, 3]),
      createdAt: new Date(),
      description: $faker.lorem.paragraph(),
      id: undefined,
      ownerId: undefined,
      price: String($faker.number.float({ min: 100, max: 5000 })),
      published: $faker.datatype.boolean(),
      updatedAt: undefined,
      name: $faker.commerce.productName(),
    };

    return data;
  });
});

export const ReviewFactory = createFactory(ReviewRepo, ($faker) => {
  return Effect.succeed({
    comment: $faker.commerce.productDescription(),
    productId: undefined,
    userId: undefined,
    createdAt: $faker.date.past(),
    images: [],
    rating: $faker.number.int({ min: 0, max: 5 }),
  } satisfies typeof reviewsTable.$inferInsert);
});

export const CommentFactory = createFactory(CommentRepo, ($faker) => {
  return Effect.succeed({
    comment: $faker.commerce.productDescription(),
    reviewId: undefined,
    userId: undefined,
    id: undefined,
    parentCommentId: undefined,
    createdAt: $faker.date.past(),
  } as Comment);
});

export const cartItemsFactory = createFactory(CartItemsRepo, ($faker) => {
  return Effect.succeed({
    cartId: undefined,
    productId: undefined,
    quantity: $faker.number.int({ min: 1, max: 3 }),
  });
});

export const orderFactory = createFactory(OrderRepo, ($faker) => {
  return Effect.succeed({
    buyerId: undefined,
    sellerId: undefined,
    total: 5000,
    paymentId: undefined,
    status: "pending",
    deliveryType: $faker.helpers.arrayElement(["home", "pickup"]),
  });
});

export const orderItemsFactory = createFactory(OrderItemsRepo, ($faker) => {
  return Effect.succeed({
    orderId: undefined,
    productId: undefined,
    quantity: $faker.number.int({ min: 1, max: 3 }),
  });
});

export const addressFactory = createFactory(UserLocationRepo, ($faker) => {
  return Effect.succeed({
    userId: undefined,
    placeId: $faker.location.zipCode(),
    longitude: $faker.location.longitude(),
    latitude: $faker.location.latitude(),
    state: $faker.location.state(),
    street: $faker.location.street(),
    city: $faker.location.city(),
  });
});
