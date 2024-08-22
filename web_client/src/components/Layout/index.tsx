import type { ReactNode } from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Props {
  children: ReactNode;
  header?: boolean;
  footer?: boolean;
}

const Layout = ({ children, header = true, footer = true }: Props) => {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {header && <Header />}
      <main className="flex flex-grow">{children}</main>
      {footer && <Footer />}
    </div>
  );
};

export default Layout;
