import { Text } from "@react-email/components";
import type React from "react";
import { createElement as h } from "react";

export function TextBase(props: React.ComponentProps<typeof Text>) {
  const text = {
    color: "#333",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    fontSize: "14px",
  };

  return <Text {...props} style={{ ...text, ...props.style }} />;
}
