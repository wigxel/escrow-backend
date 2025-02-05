import { z } from "zod";
import { TextBase } from "~/resources/view/mail/shared/_text-base";
import Layout from "../shared/_layout";
import { createElement as h } from "react";

const schema = z.object({
  username: z.string(),
  otp: z.string(),
});

export function PasswordResetView({
  username = "",
  otp,
}: z.infer<typeof schema>) {
  return (
    <Layout title="Reset your account password">
      <TextBase style={{ fontSize: 16, marginBottom: "14px" }}>
        Hi {username}
      </TextBase>
      <TextBase>
        We received a request to reset the password for your [Your Company Name]
        account. To ensure your security, please use the One-Time Password (OTP)
        below to reset your password:
      </TextBase>
      <TextBase style={{ fontWeight: "bold", fontSize: 16 }}>{otp}</TextBase>
      <TextBase>
        This step is to ensure that your email address is not used without your
        consent.
      </TextBase>
    </Layout>
  );
}
