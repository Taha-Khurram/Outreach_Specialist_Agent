import Sidebar from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-full">
        <Sidebar />
        <main className="pl-64">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
