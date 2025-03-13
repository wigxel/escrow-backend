import { overwriteObject } from "../../tests/mocks/helpers";

it("should proxy object properties and methods", () => {
  class A {
    me = "false";
    public watch() {
      return 1;
    }
  }

  const object = overwriteObject(
    "key-object",
    () => ({ me_: false, watch: () => 3 }),
    {},
  );
  expect(object.watch()).toBe(3);

  const customObject = overwriteObject("key-custom-object", () => new A(), {
    watch: () => 2,
  });

  expect(customObject.watch()).toEqual(2);
});
