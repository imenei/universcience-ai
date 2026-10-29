import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniverScience AI — Learning Studio",
  description: "Un espace d’apprentissage universitaire guidé par vos sources de cours.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
