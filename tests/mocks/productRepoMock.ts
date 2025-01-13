import { Effect, Layer } from "effect";
import { randomUUID } from "uncrypto";
import { Product } from "~/migrations/tables/interfaces";
import {
  ProductRepo,
  ProductRepository,
} from "~/repositories/product.repository";
import { extendMockImplementation } from "~/tests/mocks/helpers";

const ProductMock: ProductRepository = {
  // @ts-expect-error
  create(data: Product) {
    return Effect.succeed([
      {
        name: data.name,
        price: data.price,
        categoryId: data.categoryId,
        description: data.description,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: data.ownerId,
        published: false,
        deletedAt: new Date(),
        availability: true,
        rating: "",
      },
    ]);
  },

  firstOrThrow(id: string, currentUserId: string) {
    return Effect.succeed({
      name: "product name",
      price: "2",
      categoryId: 2,
      description: "description",
      id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: currentUserId ?? "owner-id",
      published: true,
      deletedAt: new Date(),
      availability: true,
      productImages: [{}],
      productLocation: {},
      rating: "",
      stock: 1,
    });
  },

  // @ts-expect-error
  getProductDetails(id: string, currentUserId: string) {
    return Effect.succeed({
      name: "product name",
      price: "2",
      categoryId: 2,
      description: "description",
      id: id,
      createdAt: new Date(2024, 6, 30),
      updatedAt: new Date(2024, 6, 30),
      ownerId: currentUserId ?? "owner-id",
      published: true,
      deletedAt: new Date(2024, 6, 30),
      availability: true,
      ownerDetails: {},
      productLocation: {},
      productImages: [{}],
      locationId: 1,
      rating: "",
      stock: 1,
    });
  },

  getProducts(paginate, currentUserId) {
    return Effect.succeed([
      {
        name: "product name",
        price: "2",
        categoryId: 2,
        description: "description",
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: currentUserId ?? randomUUID(),
        published: false,
        deletedAt: null,
        availability: true,
        productImages: [{ imageUrl: "image.jepg" }],
      },
    ]);
  },

  getTotalCount(currentUserId) {
    return Effect.succeed({
      count: 1,
    });
  },

  // @ts-expect-error
  update(currentUserId, productId, data) {
    return Effect.succeed({
      name: "product name",
      price: "2",
      categoryId: 2,
      description: "description",
      id: productId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: currentUserId ?? randomUUID(),
      published: false,
      deletedAt: null,
      availability: true,
      ...data,
      rating: "",
    });
  },

  searchByQuery(query, searchColumn, currentUserId) {
    return Effect.succeed({
      results: [
        {
          name: "product name",
          price: "2",
          categoryId: 2,
          description: "description",
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: currentUserId ?? randomUUID(),
          published: false,
          deletedAt: null,
          availability: true,
          image_url: "image.jpg",
        },
      ],
      total: "1",
    });
  },

  // @ts-expect-error
  find() {
    return Effect.succeed({
      id: randomUUID(),
      name: "somename",
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "someowner",
      categoryId: 1,
      description: "somedescription",
      price: "0.00",
      rating: "0.00",
      published: true,
      availability: true,
      productLocation: [],
      productImages: [],
    });
  },
};

export const extendProductRepo = extendMockImplementation(
  ProductRepo,
  () => ProductMock,
);

export const ProductRepoTest = Layer.succeed(ProductRepo, ProductMock);
