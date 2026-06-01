import Sidebar from '@/components/layout/Sidebar';
import PageTransition from '@/components/layout/PageTransition';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen bg-[#f8fafc]">
          <Sidebar />
          <main className="pl-[260px] min-h-screen">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
