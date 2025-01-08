import { Heading } from "@react-email/components";
import { createElement as h } from "react";

export function Header() {
  return <Heading style={h1}>TheYardBazaar</Heading>;
}

const h1 = {
  color: "black",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};
