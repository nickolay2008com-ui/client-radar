import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Radar",
  description: "Daily Gmail follow-up reports for freelancers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
