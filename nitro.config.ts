import "dotenv/config";
import { env } from "std-env";

const envar = (key: string) => env[key] ?? env[`NITRO_${key}`];

//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "./",
  apiDir: "./app/http",
  preset: "aws-amplify",
  awsAmplify: {
    // catchAllStaticFallback: true,
    // imageOptimization: { path: "/_image", cacheControl: "public, max-age=3600, immutable" },
    // imageSettings: {},
  },
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
    STRIPE_PUBLIC_KEY: envar("STRIPE_PUBLIC_KEY"),
    STRIPE_SECRET_KEY: envar("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SIGNING_SECRET: envar("STRIPE_WEBHOOK_SIGNING_SECRET"),
    FIREBASE_CONFIG: envar("FIREBASE_CONFIG"),
  },
  compatibilityDate: "2024-12-01",
});
