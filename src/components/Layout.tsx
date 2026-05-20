import Head from "next/head";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import type { SiteContent } from "@/lib/strapi";

interface LayoutProps {
  site: SiteContent;
  title?: string;
  description?: string;
  children: ReactNode;
}

export default function Layout({ site, title, description, children }: LayoutProps) {
  const fullTitle = title ? `${title} — Heirloom` : "Heirloom Furniture";
  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        {description ? <meta name="description" content={description} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header nav={site.nav} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <Footer note={site.footerNote} />
    </>
  );
}
