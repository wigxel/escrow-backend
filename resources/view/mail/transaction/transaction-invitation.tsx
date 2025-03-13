import { z } from "zod";
import { BaseButton } from "../../../../resources/view/mail/shared/_base-button";
import { TextBase } from "../../../../resources/view/mail/shared/_text-base";
import Layout from "../shared/_layout";
import { createElement as h } from "react";

const schema = z.object({
  username: z.string(),
  action: z.object({
    link: z.string().url(),
    text: z.string(),
  }),
});

export function TransactionInvitation({
  username = "James",
  action = { link: "https://google.com", text: "Accept invitation" },
}: z.infer<typeof schema>) {
  return (
    <Layout title="Invitation sent">
      <TextBase style={{ fontSize: 16, marginBottom: "14px" }}>
        Hi {username}
      </TextBase>
      <TextBase>
        An escrow invitation to move forward with our transaction via escrow.
        Please check the details and let me know if everything looks good to
        you.
      </TextBase>
      <TextBase>
        Once you accept, we can proceed with the payment and shipping
        arrangements.
      </TextBase>
      <BaseButton href={action?.link} target="_blank">
        {action.text}
      </BaseButton>
    </Layout>
  );
}
