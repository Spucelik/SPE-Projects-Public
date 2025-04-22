import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarHeader,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Home, FolderOpen, FileText, LogOut, User } from 'lucide-react';
import { appConfig } from '../config/appConfig';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If not authenticated, don't render the layout
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar>
        <SidebarHeader className="px-4 py-3 border-b">
          <div className="text-xl font-semibold">{appConfig.appName}</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === '/'}
                  tooltip="Home"
                >
                  <Link to="/">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === '/projects'}
                  tooltip="Projects"
                >
                  <Link to="/projects">
                    <FolderOpen />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname.startsWith('/files')}
                  tooltip="Files"
                >
                  <Link to="/files">
                    <FileText />
                    <span>Files</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset className="flex flex-col">
        <header className="flex justify-between items-center px-6 py-3 bg-white border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">{appConfig.appName}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <User size={18} />
                <span>{user.username || user.name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

        <footer className="p-4 border-t text-center text-sm text-gray-500">
          <a 
            href="https://aka.ms/start-spe" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Get Started with SharePoint Embedded
          </a>
        </footer>
      </SidebarInset>
    </div>
  );
};

export default Layout;
