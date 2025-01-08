import { type Context, Layer } from "effect";

// TODO: Give extendMockImplementation a better name
export function extendMockImplementation<
  // biome-ignore lint/suspicious/noExplicitAny: Must be any to ensure it works
  TContext extends Context.Tag<any, any>,
  TInstance,
>(context: TContext, createInstance: () => TInstance) {
  const key = context.key;
  return (overwrites: Partial<TInstance>) => {
    return Layer.succeed(
      context,
      // @ts-expect-error
      overwriteObject(key, createInstance, overwrites),
    );
  };
}

const cache = new Map();

export function overwriteObject<TInstance>(
  key: string,
  createInstance: () => TInstance,
  overwrites: Partial<TInstance>,
): TInstance {
  const createNew = (key: string) => {
    // console.log(`Cache MISS for ${key}`);
    const newInstance = createInstance();

    cache.set(
      key,
      newInstance.constructor.name === "Object"
        ? Object.assign({}, newInstance)
        : newInstance,
    );

    return cache.get(key);
  };

  const fromCache = (key: string) => {
    // console.log(`Cache HIT for ${key}`);
    return cache.get(key);
  };

  const instance = cache.has(key) ? fromCache(key) : createNew(key);

  return new Proxy(instance, {
    // biome-ignore lint/suspicious/noExplicitAny: Very much needed
    get(target: any, p: string | symbol, receiver: any): any {
      if (overwrites[p]) {
        return overwrites[p];
      }
      return target[p];
    },
  });
}
