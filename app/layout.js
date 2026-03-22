import { Roboto, Playwrite_DK_Uloopet } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"],
  variable: "--font-roboto" 
});

// The specific handwritten font for the logo
const playwrite = Playwrite_DK_Uloopet({
 weight:"400",
  variable: "--font-playwrite",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${roboto.variable} ${playwrite.variable}`}>
      <body className="font-roboto">{children}</body>
    </html>
  );
}

export const metadata = {
  title: "CryptoByte",
  description: "A crypto trading website",
};
