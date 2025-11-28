import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="text-2xl font-bold text-primary">
            Xpense
          </NavLink>
          
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/"
                end
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/expenses"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary"
              >
                Expenses
              </NavLink>
              <NavLink
                to="/budget"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary"
              >
                Budget
              </NavLink>
              <NavLink
                to="/analytics"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary"
              >
                Analytics
              </NavLink>
            </nav>
          )}
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <NavLink to="/auth/login">
            <Button>Login</Button>
          </NavLink>
        )}
      </div>
    </header>
  );
};
