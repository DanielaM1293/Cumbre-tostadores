import { useEffect } from 'react';
import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import CartDrawer from './components/CartDrawer.jsx';
import Footer from './components/Footer.jsx';
import Navbar from './components/Navbar.jsx';
import Toaster from './components/Toaster.jsx';
import Checkout from './pages/Checkout.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import OrderStatus from './pages/OrderStatus.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import SimulatedPay from './pages/SimulatedPay.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Login from './pages/admin/Login.jsx';
import Orders from './pages/admin/Orders.jsx';
import Products from './pages/admin/Products.jsx';

// Al cambiar de página vuelve arriba, salvo que el enlace apunte a una sección (#catalogo).
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Shell() {
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="main"><Outlet /></main>
      <Footer />
      <CartDrawer />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido/:id" element={<OrderStatus />} />
          <Route path="/pago-simulado/:id" element={<SimulatedPay />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<Products />} />
            <Route path="pedidos" element={<Orders />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
