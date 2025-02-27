import "./globals.css";
import { Providers } from './providers';

export const metadata = {
  title: "Cartna - ChatGPT for shopping",
  description: "The best way to buy from supermarkets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
