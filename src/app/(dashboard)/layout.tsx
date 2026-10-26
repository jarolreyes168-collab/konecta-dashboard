import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { UserRole } from '@/core/domain/consolidado.entity';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simulación de usuario en sesión (en producción se obtiene de la cookie o Auth.js)
  const user = {
    name: 'Jarol Reyes',
    email: 'jarol.reyes@konecta.com',
    role: 'ADMIN' as UserRole,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0B0F19]">
      <Sidebar isAdminOrCoordinator={user.role === 'ADMIN' || user.role === 'COORDINADOR'} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
