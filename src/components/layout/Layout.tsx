import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import CookieBanner from './CookieBanner';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="site-shell">
      <Header />
      <main id="main-content" style={{ paddingTop: 'var(--header-height)' }}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <CookieBanner />
    </div>
  );
}
