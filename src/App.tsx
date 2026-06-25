import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Schedule  = lazy(() => import('./pages/Schedule'));
const Calendar  = lazy(() => import('./pages/Calendar'));
const Settings  = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 rounded-full border-4 border-mist border-t-ocean-blue animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
