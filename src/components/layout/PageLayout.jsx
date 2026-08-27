import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function PageLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-[250px] transition-all duration-300">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
