// Layout.tsx
import { Html, Head, Body, Container, Preview } from "@react-email/components";
import { createElement as h } from "react";
import { Header } from "./_header";
import { Footer } from "./_footer";

interface LayoutProps {
  title: string;
  children: React.ReactNode;
}

export function Layout({ title="", children }: LayoutProps) {
  return (
    <Html>
      <Head/>
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header/>
          {children}
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
};

const container = {
  paddingLeft: "12px",
  paddingRight: "12px",
  margin: "0 auto",
};

export default Layout;
