import { AESAlgo } from "./reversible-hasher";

it("should decipher", () => {
  const SALT = "hello";
  const IV_HEX = "c28d1b0086ac1d7c82d57ac22d5abbaf";

  const instance_lgo = new AESAlgo("hello", IV_HEX);
  const algo = new AESAlgo("hello", IV_HEX);

  const encrypted_string = algo.encrypt("Frank moore");
  const decrypted_value = instance_lgo.decrypt(encrypted_string);

  expect(decrypted_value).toMatchInlineSnapshot(`"Frank moore"`);
});
