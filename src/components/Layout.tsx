import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Vote, User, Settings, LogOut, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Vote className="h-8 w-8" />
            ElectionHub
          </Link>

          <nav className="flex items-center gap-1">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              size="sm"
              asChild
              className="gap-2"
            >
              <Link to="/">
                <Home className="h-4 w-4" />
                Elections
              </Link>
            </Button>

            {user ? (
              <>
                <Button
                  variant={isActive('/profile') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <Link to="/profile">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>

                {user.is_admin && (
                  <Button
                    variant={isActive('/admin') ? 'admin' : 'ghost'}
                    size="sm"
                    asChild
                    className="gap-2"
                  >
                    <Link to="/admin">
                      <Settings className="h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-card mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 ElectionHub. Secure, Transparent, Democratic.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;