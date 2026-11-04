import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import HowTo from './pages/HowTo';
import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import Impressum from './pages/legal/Impressum';
import Datenschutz from './pages/legal/Datenschutz';
import AGB from './pages/legal/AGB';
import Widerruf from './pages/legal/Widerruf';
import Versand from './pages/legal/Versand';
import NotFound from './pages/NotFound';
import Account from './pages/Account';
import CheckoutResult from './pages/CheckoutResult';
import WithdrawalOnline from './pages/legal/WithdrawalOnline';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/category/:slug" element={<CategoryPage />} />
            <Route path="/shop/product/:handle" element={<ProductDetail />} />
            <Route path="/shop/:handle" element={<ProductDetail />} />
            <Route path="/how-to" element={<HowTo />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/konto" element={<Account />} />
            <Route path="/checkout/success" element={<CheckoutResult />} />
            <Route path="/checkout/cancel" element={<CheckoutResult cancelled />} />
            <Route path="/legal/impressum" element={<Impressum />} />
            <Route path="/legal/datenschutz" element={<Datenschutz />} />
            <Route path="/legal/agb" element={<AGB />} />
            <Route path="/legal/widerruf" element={<Widerruf />} />
            <Route path="/widerruf/online" element={<WithdrawalOnline />} />
            <Route path="/legal/versand" element={<Versand />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
