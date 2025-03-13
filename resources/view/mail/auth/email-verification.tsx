import { z } from "zod";
import { TextBase } from "../../../../resources/view/mail/shared/_text-base";
import Layout from "../shared/_layout";
import { createElement as h } from "react";

const schema = z.object({
  username: z.string(),
  otp: z.string(),
});

export function EmailVerifcationView({
  username = "",
  otp,
}: z.infer<typeof schema>) {
  return (
    <Layout title="Verify Email Address">
      <TextBase style={{ fontSize: 16, marginBottom: "14px" }}>
        Hi {username}
      </TextBase>
      <TextBase>
        To complete your registration and activate your account, please verify
        your email address by entering the following One-Time Password (OTP):
      </TextBase>
      <TextBase style={{ fontWeight: "bold", fontSize: 16 }}>{otp}</TextBase>
      <TextBase>
        This step is to ensure that your email address is not used without your
        consent. You can ignore this email if this was not triggered by you
      </TextBase>
    </Layout>
  );
}
