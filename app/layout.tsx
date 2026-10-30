import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./landing-page.css";

export const metadata: Metadata = {
  title: { default: "UniverScience AI", template: "%s — UniverScience AI" },
  description: "Un espace d’apprentissage universitaire guidé par vos sources de cours.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
