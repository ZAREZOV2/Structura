import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SkladCategories } from './pages/sklad/SkladCategories';
import { SkladDashboard } from './pages/sklad/SkladDashboard';
import { SkladLayout } from './pages/sklad/SkladLayout';
import { SkladMovements } from './pages/sklad/SkladMovements';
import { SkladProductDetail } from './pages/sklad/SkladProductDetail';
import { SkladProducts } from './pages/sklad/SkladProducts';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sklad" element={<SkladLayout />}>
          <Route index element={<SkladDashboard />} />
          <Route path="products" element={<SkladProducts />} />
          <Route path="products/:id" element={<SkladProductDetail />} />
          <Route path="categories" element={<SkladCategories />} />
          <Route path="movements" element={<SkladMovements />} />
        </Route>
      </Route>
    </Routes>
  );
}
