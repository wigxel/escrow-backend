import { Context, Layer } from "effect";
import { otpTable } from "../migrations/schema";
import { DrizzleRepo } from "../services/repository/RepoHelper";

export class OtpRepository extends DrizzleRepo(otpTable, "id") {}

export class OtpRepo extends Context.Tag("OtpRepo")<OtpRepo, OtpRepository>() {}

export const OTPRepoLayer = Layer.succeed(OtpRepo, new OtpRepository());
