import { Config, Effect, pipe } from "effect";
// @ts-expect-error
import { defineEventHandler, type H3CorsOptions, type H3Event } from "h3";
import { NitroApp } from "~/utils/effect";

const whitelist = pipe(
  Config.string("ALLOWED_DOMAINS"),
  Config.map((val) => val.split(",").map((e) => e.trim())),
  Config.validate({
    message: "CORS origins missing. Expected at-least one origin",
    validation: (e) => e.length > 0,
  }),
  Effect.tap((v) => Effect.logDebug(">> Payload", v)),
);

function matchesUrlGlob(pattern: string, input: string) {
  const re = new RegExp(
    pattern.replace(/([.?+^$[\]\\(){}|\/-])/g, "\\$1").replace(/\*/g, ".*"),
  );
  return re.test(input);
}

function useCORS(event: H3Event, options: H3CorsOptions): boolean {
  const { methods = [] } = options;

  const methodIsAllowed =
    (Array.isArray(methods) && methods.includes(event.method)) ||
    methods === "*";

  const methodIsOptions = event.method === "OPTIONS";

  // If the method is not allowed, return:
  if (!methodIsAllowed && !methodIsOptions) {
    return false;
  }

  // If the method is allowed and If OPTIONS is allowed, append headers:
  if (isPreflightRequest(event)) {
    appendCorsPreflightHeaders(event, options);
    sendNoContent(event, options.preflight?.statusCode || 204);
    return true;
  }

  // If the method is allowed and the method is OPTIONS, append CORS headers:
  appendCorsHeaders(event, options);
  return false;
}

export default defineEventHandler(async (event: H3Event) => {
  const allowedDomains = NitroApp.runSync(event, whitelist);
  const options: H3CorsOptions = {
    methods: ["POST", "PUT", "PATCH", "GET", "DELETE", "OPTIONS"],
    origin: (originUrl) => {
      return allowedDomains.some((allowedOriginGlob) =>
        matchesUrlGlob(allowedOriginGlob, originUrl),
      );
    },
  };

  useCORS(event, options);
});
