import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-cream-bg flex w-full">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-[1440px] mx-auto px-8 py-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
