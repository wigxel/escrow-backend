import { Effect } from "effect";
import { ExpectedError } from "~/config/exceptions";
import type { SessionUser } from "~/layers/session-provider";
import type { TInsertAddress } from "~/migrations/schema";
import { OrderRepoLayer } from "~/repositories/order.repository";
import { OrderItemsRepoLayer } from "~/repositories/orderItems.repository";
import { UserLocationRepoLayer } from "~/repositories/userLocation.repo";
import { PaginationService } from "~/services/search/pagination.service";
import { SearchOps } from "./search/sql-search-resolver";
import { NoSuchElementException } from "effect/Cause";

type LocationId = string;

export const addNewLocation = (data: {
  user: SessionUser;
  location: TInsertAddress;
}) => {
  return Effect.gen(function* (_) {
    const userLocationRepo = yield* UserLocationRepoLayer.Tag;
    yield* userLocationRepo.create({
      userId: data.user.id,
      ...data.location,
    });

    return { status: true, message: "New location added" };
  });
};

export const getUserLocations = (data: { userId: string }) => {
  return Effect.gen(function* (_) {
    const userLocationRepo = yield* UserLocationRepoLayer.Tag;
    const paginate = yield* PaginationService;

    const locationCount = yield* userLocationRepo.count(
      SearchOps.eq("userId", data.userId),
    );

    const userLocations = yield* userLocationRepo.all({
      ...paginate.query,
      where: SearchOps.eq("userId", data.userId),
    });

    return {
      data: userLocations,
      meta: {
        ...paginate.meta,
        total: locationCount,
        total_pages: Math.ceil(locationCount / paginate.query.pageSize),
      },
    };
  });
};

export const getLocationDetails = (locationId: LocationId) => {
  return Effect.gen(function* (_) {
    const locationRepo = yield* UserLocationRepoLayer.Tag;

    const locationDetails = yield* locationRepo
      .firstOrThrow({ id: locationId })
      .pipe(
        Effect.mapError((err) => {
          if (err instanceof NoSuchElementException)
            return new NoSuchElementException("Invalid location id");
          return err;
        }),
      );

    return { data: locationDetails };
  });
};

export const editLocation = (
  currentUser: SessionUser,
  locationId: LocationId,
  data: TInsertAddress,
) => {
  return Effect.gen(function* (_) {
    const locationRepo = yield* UserLocationRepoLayer.Tag;

    yield* locationRepo
      .firstOrThrow(
        SearchOps.and(
          SearchOps.eq("id", locationId),
          SearchOps.eq("userId", currentUser.id),
        ),
      )
      .pipe(Effect.mapError(() => new ExpectedError("Invalid location id")));

    const canEdit = yield* locationNotInOrder(currentUser.id, locationId);

    if (canEdit === false) {
      yield* new ExpectedError(
        "Unable to edit: Location is used in an active order",
      );
    }

    // update location
    yield* locationRepo.update({ id: locationId }, data);

    return { status: true, message: "Location updated successfully." };
  });
};

export const deleteLocation = (data: {
  currentUser: SessionUser;
  locationId: LocationId;
}) => {
  return Effect.gen(function* (_) {
    const locationRepo = yield* UserLocationRepoLayer.Tag;

    yield* locationRepo
      .firstOrThrow(
        SearchOps.and(
          SearchOps.eq("id", data.locationId),
          SearchOps.eq("userId", data.currentUser.id),
        ),
      )
      .pipe(Effect.mapError(() => new ExpectedError("Invalid location id")));

    // TODO: SCOPE This is tightly coupled. I think the order should have it's own shipping address table
    const canDelete = yield* locationNotInOrder(
      data.currentUser.id,
      data.locationId,
    );

    if (canDelete === false) {
      yield* new ExpectedError(
        "Unable to delete: Location is used in an active order",
      );
    }
    // TODO: END SCOPE

    //delete location
    yield* locationRepo.delete(SearchOps.eq("id", data.locationId));

    return { status: true, message: "Location deleted successfully." };
  });
};

export const locationNotInOrder = (
  sellerId: string,
  locationId: LocationId,
) => {
  return Effect.gen(function* (_) {
    const orderRepo = yield* OrderRepoLayer.Tag;
    const orderItemsRepo = yield* OrderItemsRepoLayer.Tag;

    // check for user order
    const sellerOrder = yield* orderRepo.all({
      where: SearchOps.eq("sellerId", sellerId),
    });

    if (!sellerOrder.length) return true;

    // TODO: Let SQL handle this check. You don't need a for loop because
    // it'll slow down the application
    for (const order of sellerOrder) {
      const orderItem = yield* orderItemsRepo.getItemsWithProductDetails({
        orderId: order.id,
      });

      if (orderItem.productDetails.locationId === locationId) {
        return false;
      }
    }

    return true;
  });
};

export function userHasAddress({
  userId,
  addressId,
}: { userId: string; addressId: string }) {
  return Effect.gen(function* (_) {
    const locationRepo = yield* UserLocationRepoLayer.Tag;

    yield* Effect.logDebug(
      `Checking if Address(${addressId}) belongs to this User(${userId})`,
    );

    return yield* _(
      locationRepo.count(
        SearchOps.and(
          SearchOps.eq("id", addressId),
          SearchOps.eq("userId", userId),
        ),
      ),
      Effect.flatMap((c) =>
        c > 0
          ? Effect.void
          : new NoSuchElementException("Invalid address provided"),
      ),
    );
  });
}
