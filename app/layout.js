import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "KOSEN Portal",
  description: "College of Industrial Technology portal and admin system",
  icons: {
    icon: "/logo/kosen.png",
    apple: "/logo/kosen.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
          <Providers>{children}</Providers>
        </body>
    </html>
  );
}
