import { Effect, Layer } from "effect";
import { expect } from "vitest";
import { notNil } from "~/libs/query.helpers";
import { FindArg1, FindArg2 } from "~/services/repository/repo.types";
import {
  addNewLocation,
  deleteLocation,
  editLocation,
  getLocationDetails,
  getUserLocations,
  locationNotInOrder,
} from "~/services/userLocation.service";
import { runTest } from "./mocks/app";
import { extendOrderItemsRepo } from "./mocks/orderItemsRepoMock";
import { extendOrderRepo } from "./mocks/orderRepoMock";
import { extendUserLocationRepo } from "./mocks/userLocationRepoMock";

const MOCK_LOCATION_ID = "MOCK_LOCATION_ID";

describe("User location service", () => {
  describe("Add new location", () => {
    test("should create new user location", async () => {
      let created = false;
      const addressRepo = extendUserLocationRepo({
        //@ts-expect-error
        create(data) {
          created = true;
          return Effect.succeed([{}]);
        },
      });

      const program = addNewLocation({
        user: { id: "user-id" },
        location: { placeId: "place-id" },
      });
      const result = await runTest(Effect.provide(program, addressRepo));
      expect(created).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "New location added",
          "status": true,
        }
      `);
    });
  });

  describe("get user locations", () => {
    test("should return all user location", async () => {
      const program = getUserLocations({ userId: "user-id" });
      const result = await runTest(program);
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe("get location details", () => {
    test("should fail for invalid location id", async () => {
      const userLocationRepo = extendUserLocationRepo({
        firstOrThrow(where) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = getLocationDetails("MOCK_LOCATION_ID");
      const result = runTest(Effect.provide(program, userLocationRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[NoSuchElementException: Invalid location id]`,
      );
    });

    test("should retrieve location details", async () => {
      const userLocationRepo = extendUserLocationRepo({
        firstOrThrow(arg1: FindArg1, arg2?: FindArg2) {
          return Effect.succeed({
            city: "city",
            id: "MOCK_LOCATION_ID",
            latitude: "43.56677",
            longitude: "75.9053",
            placeId: "place-id",
            state: "state",
            street: "street",
            userId: "user-id",
          });
        },
      });

      const program = Effect.provide(
        getLocationDetails("MOCK_LOCATION_ID"),
        userLocationRepo,
      );

      const result = await runTest(program);
      expect(result.data).toMatchInlineSnapshot(`
        {
          "city": "city",
          "id": "MOCK_LOCATION_ID",
          "latitude": "43.56677",
          "longitude": "75.9053",
          "placeId": "place-id",
          "state": "state",
          "street": "street",
          "userId": "user-id",
        }
      `);
    });
  });

  describe("edit location", () => {
    test("should fail if invalid location id", async () => {
      const userLocationRepo = extendUserLocationRepo({
        firstOrThrow(where) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = editLocation({ id: "user-id" }, MOCK_LOCATION_ID, {});
      const result = runTest(Effect.provide(program, userLocationRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid location id]`,
      );
    });

    test("should fail edit if location is in active order", async () => {
      const orderRepo = extendOrderRepo({
        // @ts-expect-error
        find(data) {
          return Effect.succeed([
            {
              id: "order-id",
              deliveryType: "home",
              paymentId: "payment-id",
              sellerId: "seller-id",
              status: "delivered",
              total: "200",
              userId: "user-id",
              createdAt: new Date(),
              paymentDetails: {},
              orderItems: [{}],
            },
          ]);
        },
      });
      const orderItemsRepo = extendOrderItemsRepo({
        getItemsWithProductDetails(data) {
          return Effect.succeed({
            id: 1,
            orderId: "order-id",
            productId: "product-id",
            quantity: 1,
            productDetails: {
              locationId: "MOCK_LOCATION_ID",
            },
          });
        },
      });

      const program = editLocation(
        { id: "current-user-id" },
        MOCK_LOCATION_ID,
        {},
      );
      const result = runTest(
        Effect.provide(program, Layer.merge(orderRepo, orderItemsRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unable to edit: Location is used in an active order]`,
      );
    });

    test("should edit location", async () => {
      let edited = false;

      const orderRepo = extendOrderRepo({
        all(data) {
          return Effect.succeed([]);
        },
      });

      const locationRepo = extendUserLocationRepo({
        update(where, data) {
          edited = true;
          return Effect.succeed([{ id: MOCK_LOCATION_ID }]);
        },
      });

      const program = editLocation({ id: "user-id" }, MOCK_LOCATION_ID, {});
      const result = await runTest(
        Effect.provide(program, Layer.merge(orderRepo, locationRepo)),
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "Location updated successfully.",
          "status": true,
        }
      `);
      expect(edited).toBeTruthy();
    });
  });

  describe("Delete location", () => {
    test("should fail if invalid location id", async () => {
      const userLocationRepo = extendUserLocationRepo({
        firstOrThrow(where) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = deleteLocation({
        currentUser: { id: "current-user" },
        locationId: "MOCK_LOCATION_ID",
      });
      const result = runTest(Effect.provide(program, userLocationRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid location id]`,
      );
    });

    test("should fail delete if location is in active order", async () => {
      const orderRepo = extendOrderRepo({
        // @ts-expect-error
        find(data) {
          return Effect.succeed([
            {
              id: "order-id",
              deliveryType: "home",
              paymentId: "payment-id",
              sellerId: "seller-id",
              status: "delivered",
              total: "200",
              userId: "user-id",
              createdAt: new Date(),
              paymentDetails: {},
              orderItems: [{}],
            },
          ]);
        },
      });
      const orderItemsRepo = extendOrderItemsRepo({
        getItemsWithProductDetails(data) {
          return Effect.succeed({
            id: 1,
            orderId: "order-id",
            productId: "product-id",
            quantity: 1,
            productDetails: {
              locationId: "MOCK_LOCATION_ID",
            },
          });
        },
      });

      const program = deleteLocation({
        currentUser: { id: "current-user" },
        locationId: "MOCK_LOCATION_ID",
      });
      const result = runTest(
        Effect.provide(program, Layer.merge(orderRepo, orderItemsRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unable to delete: Location is used in an active order]`,
      );
    });

    test("should edit location", async () => {
      let deleted = false;
      const orderRepo = extendOrderRepo({
        all(data) {
          return Effect.succeed([]);
        },
      });

      const locationRepo = extendUserLocationRepo({
        delete(where) {
          deleted = true;
          return Effect.succeed([{ id: "1" }]);
        },
      });

      const program = deleteLocation({
        currentUser: { id: "current-user" },
        locationId: "MOCK_LOCATION_ID",
      });
      const result = await runTest(
        Effect.provide(program, Layer.merge(orderRepo, locationRepo)),
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "Location deleted successfully.",
          "status": true,
        }
      `);
      expect(deleted).toBeTruthy();
    });
  });

  describe("Location exists in active order", () => {
    test("should return true if empty seller orders", async () => {
      const orderRepo = extendOrderRepo({
        // @ts-expect-error

        find(data) {
          return Effect.succeed([]);
        },
      });

      const program = locationNotInOrder("seller-id", MOCK_LOCATION_ID);
      const result = runTest(Effect.provide(program, orderRepo));
      expect(result).toBeTruthy();
    });

    test("should return true if location not in active order", async () => {
      const orderRepo = extendOrderRepo({
        // @ts-expect-error

        find(data) {
          return Effect.succeed([
            {
              id: "order-id",
              deliveryType: "home",
              paymentId: "payment-id",
              sellerId: "seller-id",
              status: "delivered",
              total: "200",
              userId: "user-id",
              createdAt: new Date(),
              paymentDetails: {},
              orderItems: [{}],
            },
          ]);
        },
      });

      const orderItemsRepo = extendOrderItemsRepo({
        getItemsWithProductDetails(data) {
          return Effect.succeed({
            id: 1,
            orderId: "order-id",
            productId: "product-id",
            quantity: 1,
            productDetails: {
              locationId: "MOCK_LOCATION_ID_2",
            },
          });
        },
      });

      const program = locationNotInOrder("seller-id", MOCK_LOCATION_ID);
      const result = await runTest(
        Effect.provide(program, Layer.merge(orderRepo, orderItemsRepo)),
      );
      expect(result).toBeTruthy();
    });

    test("should return false if location in active order", async () => {
      const orderRepo = extendOrderRepo({
        all(params) {
          return Effect.succeed([
            {
              id: "order-id",
              deliveryType: "home",
              paymentId: "payment-id",
              sellerId: "seller-id",
              status: "delivered",
              total: "200",
              userId: "user-id",
              createdAt: new Date(),
              paymentDetails: {},
              orderItems: [{}],
            },
          ]);
        },
      });

      const orderItemsRepo = extendOrderItemsRepo({
        getItemsWithProductDetails(data) {
          return Effect.succeed({
            id: 1,
            orderId: "order-id",
            productId: "product-id",
            quantity: 1,
            productDetails: {
              locationId: "MOCK_LOCATION_ID",
            },
          });
        },
      });

      const program = locationNotInOrder("seller-id", MOCK_LOCATION_ID);
      const result = runTest(
        Effect.provide(program, Layer.merge(orderRepo, orderItemsRepo)),
      );
      expect(result).resolves.toBeFalsy();
    });
  });
});
