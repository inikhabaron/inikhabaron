import AdminErrorBoundary from '@/components/AdminErrorBoundary';

export const metadata = {
  title: 'Admin Dashboard - KhabarON',
  description: 'Manage news, categories, users, and analytics',
};

export default function AdminLayout({ children }) {
  return (
    <AdminErrorBoundary>
      {children}
    </AdminErrorBoundary>
  );
}
