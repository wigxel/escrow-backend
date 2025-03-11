import { z } from "zod";
import { TextBase } from "~/resources/view/mail/shared/_text-base";
import Layout from "../shared/_layout";
import { createElement as h } from "react";

const schema = z.object({
  username: z.string(),
  otp: z.string(),
});

export function EscrowUserAccountView({
  username = "",
}: z.infer<typeof schema>) {
  return (
    <Layout title="">
      <TextBase style={{ fontSize: 16, marginBottom: "14px" }}>
        Hi {username}
      </TextBase>
      <TextBase>
        Your account has been successfully created as part of the escrow
        process. To complete your setup, please set your password.
      </TextBase>
      <TextBase>
        If you didn’t set a password earlier, you can use the 'Forgot Password'
        option at the "sign-in" page to generate one and gain access to your
        account
      </TextBase>
    </Layout>
  );
}
