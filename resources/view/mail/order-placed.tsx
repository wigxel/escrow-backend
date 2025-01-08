import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { createElement as h } from "react";
import { z } from "zod";
import { BaseButton } from "~/resources/view/mail/shared/_base-button";
import { Footer } from "~/resources/view/mail/shared/_footer";
import { Header } from "~/resources/view/mail/shared/_header";
import { TextBase } from "~/resources/view/mail/shared/_text-base";

const schema = z.object({
  productName: z.string(),
  username: z.string(),
  action: z.object({
    link: z.string().url(),
    text: z.string(),
  }),
});

export function OrderPlaced(props: z.infer<typeof schema>) {
  const { action, username, productName } = props;

  return (
    <Html>
      <Head />
      <Preview>Order Placed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />
          <TextBase style={{ fontSize: 16, marginBottom: "14px" }}>
            Hi {username}
          </TextBase>
          <TextBase style={{ fontSize: 16, marginBottom: "14px" }}>
            Your order "{productName}" has been shipped.
          </TextBase>
          <BaseButton href={action?.link} target="_blank">
            {action.text}
          </BaseButton>
          <Text style={{ marginBottom: 32 }} />
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

OrderPlaced.defaultProps = {
  username: "James",
  productName: "Some kinda wood",
  action: { link: "https://google.com", text: "View Order" },
} satisfies z.infer<typeof schema>;

const main = {
  backgroundColor: "#ffffff",
};

const container = {
  paddingLeft: "12px",
  paddingRight: "12px",
  margin: "0 auto",
};

export default OrderPlaced;
