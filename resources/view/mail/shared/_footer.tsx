import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { createElement as h } from "react";
import { TextBase } from "~/resources/view/mail/shared/_text-base";

export function Footer({ baseUrl = "" }) {
  return (
    <Section>
      <Row>
        <TextBase>
          This email was sent to voke@gmail.com. If you'd rather not receive
          this kind of email, you can unsubscribe or manage your email
          preferences.
        </TextBase>
        <TextBase>© 2024 TheYardBazzar, Ontario, Canada</TextBase>
        <Column colSpan={4}>
          <TextBase
            style={{
              marginTop: 4,
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "0px",
              lineHeight: "24px",
              color: "black",
            }}
          >
            TheYardBazaar
          </TextBase>
        </Column>
        <Column
          align="right"
          style={{ display: "table-cell", verticalAlign: "bottom" }}
        >
          <Row
            style={{
              display: "table-cell",
              height: 44,
              width: 56,
              verticalAlign: "bottom",
            }}
          >
            <Column style={{ paddingRight: 8 }}>
              <Link href="#">
                <Img
                  alt="Facebook"
                  height="36"
                  src="https://react.email/static/facebook-logo.png"
                  width="36"
                />
              </Link>
            </Column>
            <Column style={{ paddingRight: 8 }}>
              <Link href="#">
                <Img
                  alt="X"
                  height="36"
                  src="https://react.email/static/x-logo.png"
                  width="36"
                />
              </Link>
            </Column>
            <Column>
              <Link href="#">
                <Img
                  alt="Instagram"
                  height="36"
                  src="https://react.email/static/instagram-logo.png"
                  width="36"
                />
              </Link>
            </Column>
          </Row>
          <Row>
            <TextBase
              style={{
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 0,
                lineHeight: "19px",
                color: "rgb(107,114,128)",
              }}
            >
              123 Main Street Anytown, CA 12345
            </TextBase>
            <TextBase
              style={{
                marginTop: "0px",
                marginBottom: "0px",
                lineHeight: "19px",
                fontSize: 12,
                fontWeight: 600,
                color: "rgb(107,114,128)",
              }}
            >
              mail@example.com +1234567893
            </TextBase>
          </Row>
        </Column>
      </Row>
    </Section>
  );
}

export const link = {
  color: "#2754C5",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  textDecoration: "underline",
};
