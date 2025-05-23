
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader
} from "@/components/ui/sidebar";
import { Home, FolderOpen, FileText, LogOut, User } from 'lucide-react';
import { appConfig } from '../config/appConfig';
import SearchHeader from './SearchHeader';

interface LayoutWithSearchProps {
  children: React.ReactNode;
}

const LayoutWithSearch: React.FC<LayoutWithSearchProps> = ({ children }) => {
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
      <Sidebar className="bg-blue-600 text-white border-r border-blue-700">
        <SidebarHeader className="px-4 py-3 border-b border-blue-500">
          <div className="text-xl font-semibold text-white">{appConfig.appName}</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === '/'}
                  tooltip="Home"
                  className={`text-white hover:bg-white hover:text-blue-600 ${location.pathname === '/' ? 'bg-blue-800' : ''}`}
                >
                  <Link to="/">
                    <Home className="text-inherit" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname === '/projects'}
                  tooltip="Projects"
                  className={`text-white hover:bg-white hover:text-blue-600 ${location.pathname === '/projects' ? 'bg-blue-800' : ''}`}
                >
                  <Link to="/projects">
                    <FolderOpen className="text-inherit" />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location.pathname.startsWith('/files')}
                  tooltip="Files"
                  className={`text-white hover:bg-white hover:text-blue-600 ${location.pathname.startsWith('/files') ? 'bg-blue-800' : ''}`}
                >
                  <Link to="/files">
                    <FileText className="text-inherit" />
                    <span>Files</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      
      <SidebarInset className="flex flex-col">
        <div className="flex justify-between items-center">
          <SearchHeader />
          <div className="flex items-center gap-4 px-6 py-3 bg-blue-600 text-white">
            {user && (
              <div className="flex items-center gap-2">
                <User size={18} className="text-white" />
                <span>{user.username || user.name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-white hover:text-blue-200"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>

        <footer className="p-4 border-t text-center text-sm text-gray-500">
          <a 
            href="https://aka.ms/start-spe" 
            target="__blank" 
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

export default LayoutWithSearch;
