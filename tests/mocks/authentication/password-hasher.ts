import { PasswordHasher } from "../../../layers/encryption";
import { Argon2dPasswordHasher } from "../../../layers/encryption/presets/argon2d";
import { extendMockImplementation } from "../../../tests/mocks/helpers";

export const extendPasswordHasher = extendMockImplementation(
  PasswordHasher,
  () => Argon2dPasswordHasher,
);
