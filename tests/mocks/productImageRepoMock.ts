import { Effect, Layer } from "effect";
import { ProductImage } from "~/migrations/tables/interfaces";
import {
  ProductImageRepo,
  ProductImageRepository,
} from "~/repositories/productImage.repository";
import { extendMockImplementation } from "./helpers";

const ProductImageMock: ProductImageRepository = {
  create(data: ProductImage) {
    return Effect.succeed([
      {
        id: 1,
        imageUrl: "image-url.jpg",
        productId: "product-id",
      },
    ]);
  },

  delete(data) {
    return Effect.succeed([
      {
        id: 1,
        imageUrl: "image.jpg",
        imageId: "1",
        productId: "product-id",
      },
    ]);
  },

  all: (params) => {
    return Effect.succeed([
      {
        id: 1,
        imageUrl: "image.jpg",
        imageId: "1",
        productId: "product-id",
      },
    ]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },

  find: () => {
    throw new Error("Function not implemented.");
  },

  firstOrThrow(arg1) {
    return Effect.succeed({
      id: 1,
      imageUrl: "image.jpg",
      imageId: "1",
      productId: "product-id",
    });
  },

  update: () => {
    throw new Error("Function not implemented.");
  },
};

export const extendProductImageRepo = extendMockImplementation(
  ProductImageRepo,
  () => ProductImageMock,
);

export const ProductImageRepoTest = Layer.succeed(
  ProductImageRepo,
  ProductImageMock,
);
