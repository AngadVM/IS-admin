import type { Metadata } from "next";
import { Tag, Package, LayoutGrid } from 'lucide-react';
import './globals.css'

// --- Integrated AdminSidebar Component ---
const AdminSidebar = () => {
    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutGrid },
        { name: 'Features', href: '/admin/features', icon: Tag },
        { name: 'Subscription Plans', href: '/admin/subscription_plans', icon: Package },
    ];

    return (
        <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col p-4 shadow-xl fixed top-0 left-0">
            <div className="text-2xl font-bold text-indigo-400 mb-8 border-b border-gray-700 pb-4">
                Subscription Admin
            </div>
            <nav className="grow space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <a 
                            key={item.name} 
                            href={item.href} 
                            className="flex items-center p-3 rounded-xl transition-all duration-200 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                            <Icon className="h-5 w-5 mr-3" />
                            <span className="text-sm font-medium">{item.name}</span>
                        </a>
                    );
                })}
            </nav>
            <div className="mt-8 text-xs text-gray-500 pt-4 border-t border-gray-700">
                <p>Status: Ready</p>
            </div>
        </aside>
    );
};

// --- Main Layout ---
export const metadata: Metadata = {
  title: "Subscription Management Admin",
  description: "Admin panel for managing features and subscription plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="m-0 p-0 bg-gray-50 font-sans">
        <div className="flex min-h-screen bg-gray-50">
          <AdminSidebar />
          <main className="flex-1 ml-64">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}