import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";

const siteUrl = "https://universci-skjh9jhy.manus.space/";
const shareImage = "https://files.manuscdn.com/user_upload_by_module/session_file/310519664051678696/EsIbhhdSASZlastJ.png";
const pageTitle = "Réviser à partir de vos cours";
const pageDescription = "UniverScience AI réunit vos supports autorisés, un tuteur qui cite ses sources et des QCM liés aux documents indexés, dans un même espace de révision.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: siteUrl },
  keywords: ["apprentissage universitaire", "tuteur IA", "révision pharmacie", "QCM médecine", "cours universitaires", "révisions sciences"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "UniverScience AI",
    title: `${pageTitle} — UniverScience AI`,
    description: pageDescription,
    images: [{ url: shareImage, alt: "UniverScience AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} — UniverScience AI`,
    description: pageDescription,
    images: [shareImage],
  },
};

export default function HomePage() {
  return <LandingPage />;
}
