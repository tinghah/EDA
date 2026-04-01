import type {Metadata} from 'next';
import { Space_Grotesk, Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'EDA | Excel Data Analyzer',
  description: 'Industrial Data Workspace for Excel Data Analysis',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${robotoMono.variable} dark`}>
      <body className="bg-surface text-on-surface font-body overflow-hidden h-screen flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
