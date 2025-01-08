import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { head } from "effect/Array";
import { runDrizzleQuery } from "~/libs/query.helpers";
import { type NewOtp, otpTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";

export class OtpRepository extends DrizzleRepo(otpTable, "id") {
  // @ts-expect-error TODO: Remove business logic from repo
  create(data: NewOtp) {
    return runDrizzleQuery(async (db) => {
      const first = await db.query.otpTable.findFirst({
        where: eq(otpTable.value, data.value),
      });

      if (first) {
        return db
          .update(otpTable)
          .set(data)
          .where(eq(otpTable.value, first.id))
          .returning();
      }

      return db.insert(otpTable).values(data).returning();
    }).pipe(
      Effect.flatMap(head),
      Effect.map((d) => d),
      Effect.matchEffect({
        onSuccess: (v) => Effect.succeed(v),
        onFailure: () => Effect.succeed("Sent!"),
      }),
    );
  }

  findOne(otp: string) {
    return runDrizzleQuery((db) => {
      return db.query.otpTable.findFirst({
        where: eq(otpTable.value, otp),
      });
    });
  }

  deleteOne(otp: string) {
    return runDrizzleQuery((db) => {
      return db.delete(otpTable).where(eq(otpTable.value, otp)).returning();
    }).pipe(Effect.map((d) => d));
  }
}

export class OtpRepo extends Context.Tag("OtpRepo")<OtpRepo, OtpRepository>() {}

export const OTPRepoLayer = Layer.succeed(OtpRepo, new OtpRepository());
