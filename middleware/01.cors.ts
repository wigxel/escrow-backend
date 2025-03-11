// @ts-expect-error
import { defineEventHandler, type H3CorsOptions, type H3Event } from "h3";

const whitelist = ["localhost:*", "*garage.vercel.app"];

export default defineEventHandler(async (event) => {
  function matchesUrlGlob(pattern: string, input: string) {
    const re = new RegExp(
      pattern.replace(/([.?+^$[\]\\(){}|\/-])/g, "\\$1").replace(/\*/g, ".*"),
    );
    return re.test(input);
  }

  const options: H3CorsOptions = {
    methods: ["POST", "PUT", "PATCH", "GET", "DELETE"],
    origin: (a) => whitelist.some((e) => matchesUrlGlob(e, a)),
  };

  useCORS(event, options);
});

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
