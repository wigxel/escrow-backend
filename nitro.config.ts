import { env } from "std-env";

const envar = (key: string) => env[key] ?? env[`NITRO_${key}`];

//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "./",
  compatibilityDate: "2025-01-13",
  preset: "node_cluster",
  runtimeConfig: {
    APP_NAME: envar("APP_NAME"),
    APP_ENV: envar("APP_ENV"),
    APP_URL: envar("APP_URL"),
    LOG_LEVEL: envar("LOG_LEVEL"),
    DB_URL: envar("DB_URL"),
    MAIL_PROVIDER: envar("MAIL_PROVIDER"),
    MAIL_HOST: envar("MAIL_HOST"),
    MAIL_PORT: envar("MAIL_PORT"),
    MAIL_USERNAME: envar("MAIL_USERNAME"),
    MAIL_PASSWORD: envar("MAIL_PASSWORD"),
    MAIL_FROM: envar("MAIL_FROM"),
    ALLOWED_DOMAINS: envar("ALLOWED_DOMAINS"),
    CLOUDINARY_SECRET_KEY: envar("CLOUDINARY_SECRET_KEY"),
    CLOUDINARY_API_KEY: envar("CLOUDINARY_API_KEY"),
    CLOUDINARY_CLOUD_NAME: envar("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_FOLDER: envar("CLOUDINARY_FOLDER"),
    SERVER_URL: envar("SERVER_URL"),
    OTP_SECRET: envar("OTP_SECRET"),
    GOOGLE_API_BASE_URL: envar("GOOGLE_API_BASE_URL"),
    GOOGLE_CLIENT_ID: envar("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: envar("GOOGLE_CLIENT_SECRET"),
    SALT_HEX: envar("SALT_HEX"),
    IV_HEX: envar("IV_HEX"),
    PSK_SECRET_KEY: envar("PSK_SECRET_KEY"),
    PSK_PUBLIC_KEY: envar("PSK_PUBLIC_KEY"),
    FIREBASE_CONFIG: envar("FIREBASE_CONFIG"),
    FIREBASE_ADMIN_SDK: envar("FIREBASE_ADMIN_SDK"),
    TB_ADDRESS: envar("TB_ADDRESS"),
  },
});
