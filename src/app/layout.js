import { Sarabun } from "next/font/google";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
});

export const metadata = {
  title: "Catlingo - AI English Learning Platform",
  description: "Learn English with an AI Teacher, practice translations, and build your vocabulary.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
