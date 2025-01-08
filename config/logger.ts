import { Layer, LogLevel, Logger } from "effect";

export const LogDebugLayer = Logger.pretty.pipe(
  Layer.provideMerge(Logger.minimumLogLevel(LogLevel.Debug)),
);
