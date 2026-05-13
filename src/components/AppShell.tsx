import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-950 md:flex-row">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto w-full px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile navigation - visible on mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0">
        <MobileNav />
      </div>
    </div>
  );
}
