import { Button } from "@react-email/components";
import type React from "react";
import { createElement as h } from "react";
import { link } from "~/resources/view/mail/shared/_footer";

export function BaseButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      style={{
        ...link,
        backgroundColor: "#7F56D9",
        padding: "12px 16px 12px 16px",
        borderRadius: 9,
        color: "white",
      }}
    >
      {props.children}
    </Button>
  );
}
