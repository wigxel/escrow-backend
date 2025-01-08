import { Effect, pipe } from "effect";
import { head } from "effect/Array";
import { NoSuchElementException } from "effect/Cause";
import type { z } from "zod";
import { ExpectedError } from "~/config/exceptions";
import type {
  TProductStatusToggle,
  createProductSchema,
  productSearchDto,
} from "~/dto/product.dto";
import { saveResource } from "~/layers/storage/layer";
import type { Product } from "~/migrations/schema";
import { CategoryRepo } from "~/repositories/category.repo";
import {
  ProductRepo,
  ProductRepoLayer,
} from "~/repositories/product.repository";
import {
  ProductImageRepo,
  ProductImageRepoLayer,
} from "~/repositories/productImage.repository";
import { PaginationService } from "~/services/search/pagination.service";
import { SearchOps } from "./search/sql-search-resolver";
import { ImageTags, getResource } from "./storage.service";

export const createProduct = (
  input: z.infer<typeof createProductSchema> & { ownerId: string },
) => {
  return Effect.gen(function* (_) {
    const prodRepo = yield* ProductRepoLayer.Tag;
    const categoryRepo = yield* CategoryRepo;

    yield* _(categoryRepo.firstOrThrow(input.categoryId)).pipe(
      Effect.mapError(() => new ExpectedError("Category not found")),
    );

    const productData: Product = {
      ownerId: input.ownerId,
      name: input.name,
      categoryId: input.categoryId,
      description: input.description,
      price: String(Math.abs(input.price)),
      locationId: input.locationId,
    };

    // add product to the table
    const [data] = yield* prodRepo.create(productData);

    return {
      status: true,
      data: data,
    };
  });
};

export const getProducts = (currentUserId: string = null) => {
  return Effect.gen(function* (_) {
    const paginate = yield* PaginationService;
    const prodRepo = yield* ProductRepoLayer.Tag;
    //get all products count
    const totalProduct = yield* prodRepo.getTotalCount(currentUserId);

    const products = yield* prodRepo.getProducts(paginate.query, currentUserId);

    return {
      data: products,
      meta: {
        ...paginate.meta,
        total: totalProduct.count,
        total_pages: Math.ceil(totalProduct.count / paginate.query.pageSize),
      },
    };
  });
};

export const getProductDetails = (
  productId: string,
  currentUserId?: string,
) => {
  return Effect.gen(function* (_) {
    const prodRepo = yield* ProductRepoLayer.Tag;

    const productDetails = yield* _(
      prodRepo.getProductDetails(productId, currentUserId),
      Effect.catchTag(
        "NoSuchElementException",
        () => new NoSuchElementException("Product not found"),
      ),
    );

    return {
      data: productDetails,
      status: true,
    };
  });
};

export const editProduct = (
  currentUserId: string,
  productId: string,
  data: Partial<Product>,
) => {
  return Effect.gen(function* (_) {
    const prodRepo = yield* ProductRepoLayer.Tag;

    const searchParams = SearchOps.and(
      SearchOps.eq("id", productId),
      SearchOps.eq("ownerId", currentUserId),
      SearchOps.isNull("deletedAt"),
    );

    yield* prodRepo
      .firstOrThrow(searchParams)
      .pipe(
        Effect.mapError(() => new NoSuchElementException("Product not found")),
      );

    const payload = { ...data };

    if ("price" in payload)
      payload.price = String(Math.abs(Number(payload.price)));

    yield* prodRepo.update({ id: productId, ownerId: currentUserId }, payload);

    return {
      status: true,
    };
  });
};

export const uploadProductImage = (data: {
  productId: string;
  imageUrl: string | string[];
  currentUserId: string;
}) => {
  return Effect.gen(function* (_) {
    const prodRepo = yield* ProductRepoLayer.Tag;
    const prodImageRepo = yield* ProductImageRepoLayer.Tag;

    const query = SearchOps.and(
      SearchOps.eq("id", data.productId),
      SearchOps.eq("ownerId", data.currentUserId),
      SearchOps.isNull("deletedAt"),
    );

    yield* prodRepo
      .firstOrThrow(query)
      .pipe(
        Effect.catchTag(
          "NoSuchElementException",
          () => new NoSuchElementException("Product not found"),
        ),
      );

    const currentImageCount = yield* prodImageRepo.count(
      SearchOps.eq("productId", data.productId),
    );

    // limit to maximum of 5 images per product.
    if (currentImageCount >= 5) {
      yield* new ExpectedError("Maximum of 5 images allowed per product");
    }

    if (Array.isArray(data.imageUrl)) {
      for (const imageUrl of data.imageUrl) {
        yield* prodImageRepo.create({
          productId: data.productId,
          imageUrl: imageUrl,
        });
      }
    } else {
      yield* prodImageRepo.create({
        productId: data.productId,
        imageUrl: data.imageUrl,
      });
    }

    return { status: "Image uploaded successfully" };
  });
};

export const deleteProductImages = (data: {
  productId: string;
  currentUserId: string;
  imagesId: number | number[];
}) => {
  return Effect.gen(function* (_) {
    const prodRepo = yield* ProductRepoLayer.Tag;

    yield* prodRepo
      .firstOrThrow(
        SearchOps.and(
          SearchOps.eq("id", data.productId),
          SearchOps.eq("ownerId", data.currentUserId),
          SearchOps.isNull("deletedAt"),
        ),
      )
      .pipe(
        Effect.catchTag(
          "NoSuchElementException",
          () => new NoSuchElementException("Product not found"),
        ),
      );

    const imageIds = Array.isArray(data.imagesId)
      ? data.imagesId
      : [data.imagesId];

    const [errors, success] = yield* Effect.partition(
      imageIds,
      (id) => deleteImage({ id: String(id) }),
      { concurrency: 5 },
    );

    for (const error of errors) {
      yield* Effect.logWarning("DeleteImageErrors:", error);
    }
  });

  function deleteImage({ id: imageId }: { id: string }) {
    return Effect.gen(function* () {
      const prodImageRepo = yield* ProductImageRepo;

      const searchParams = SearchOps.and(
        SearchOps.eq("productId", data.productId),
        SearchOps.eq("id", String(imageId)),
      );

      const image = yield* prodImageRepo.find(searchParams);
      yield* prodImageRepo.delete(searchParams);

      const resource = yield* getResource(image.imageUrl);
      resource.addTag([ImageTags.markForDeletion]);

      yield* saveResource(resource);
    });
  }
};

export const deleteProduct = (data: {
  productId: string;
  currentUserId: string;
}) => {
  return Effect.gen(function* (_) {
    const prodRepo = yield* ProductRepoLayer.Tag;

    yield* pipe(
      prodRepo.firstOrThrow(
        SearchOps.and(
          SearchOps.eq("id", data.productId),
          SearchOps.eq("ownerId", data.currentUserId),
          SearchOps.isNull("deletedAt"),
        ),
      ),
      Effect.catchTag(
        "NoSuchElementException",
        () => new NoSuchElementException("Product not found"),
      ),
    );

    yield* prodRepo.update(
      { ownerId: data.currentUserId, id: data.productId },
      {
        deletedAt: new Date(),
      },
    );

    return { status: true };
  });
};

export const searchProduct = (
  data: z.infer<typeof productSearchDto>,
  currentUserId: string = null,
) => {
  return Effect.gen(function* (_) {
    const prodRepo = yield* ProductRepoLayer.Tag;
    const paginate = yield* PaginationService;

    const prodResult = yield* prodRepo.searchByQuery(
      paginate.query,
      data,
      currentUserId,
    );

    return {
      data: prodResult.results,
      meta: {
        ...paginate.meta,
        total: prodResult.total,
        total_pages: Math.ceil(
          Number(prodResult.total) / paginate.query.pageSize,
        ),
      },
    };
  });
};

export const productStatusToggle = (
  productId: string,
  toggleType: TProductStatusToggle,
  currentUserId: string = null,
) => {
  return Effect.gen(function* (_) {
    const prodRepo = yield* _(ProductRepoLayer.Tag);
    const prodImageRepo = yield* ProductImageRepoLayer.Tag;

    const productDetails = yield* _(
      prodRepo
        .firstOrThrow(
          SearchOps.and(
            SearchOps.eq("id", productId),
            SearchOps.eq("ownerId", currentUserId),
            SearchOps.isNull("deletedAt"),
          ),
        )
        .pipe(
          Effect.catchTag(
            "NoSuchElementException",
            () => new NoSuchElementException("Product not found"),
          ),
        ),
    );

    yield* prodImageRepo
      .firstOrThrow({ productId: productDetails.id })
      .pipe(
        Effect.mapError(
          () =>
            new ExpectedError(
              `Product must have an image to change ${toggleType} status`,
            ),
        ),
      );

    // current toggleType state
    const state = productDetails[toggleType];
    const updateData = { [toggleType]: !state };

    // toggle the state on save
    const updateResult = yield* _(
      prodRepo
        .update({ ownerId: currentUserId, id: productId }, updateData)
        .pipe(Effect.flatMap(head)),
    );

    return {
      data: { [toggleType]: updateResult[toggleType] },
      status: true,
    };
  });
};

export function adjustStock(params: {
  productId: string;
  ownerId: string;
  /**
   * Increment or decrement by value.
   * e.g -1 or 1
   */
  value: number;
}) {
  return Effect.gen(function* () {
    const prodRepo = yield* ProductRepo;
    const filter = { ownerId: params.ownerId, id: params.productId };

    const product = yield* prodRepo.find(filter);

    yield* prodRepo.update(filter, {
      stock: product.stock > 0 ? product.stock - 1 : 0,
    });
  });
}
