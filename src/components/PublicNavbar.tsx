import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Council Board", path: "/council-board" },
  { label: "Blog", path: "/blog" },
  { label: "Gallery", path: "/gallery" },
  { label: "Calendar", path: "/calendar" },
  { label: "Features", path: "/features" },
  { label: "Student Voice", path: "/student-voice" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="relative z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        
        {/* Brand Group */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex-shrink-0">
            <img 
              src={mengoBadge} 
              alt="Mengo crest" 
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border border-gold/30 group-hover:border-gold transition-colors" 
            />
          </div>
          <div className="flex flex-col text-left justify-center">
            <span className="text-[9px] font-bold tracking-[0.2em] text-muted-foreground uppercase leading-none">
              Mengo Senior School
            </span>
            <span className="text-base sm:text-lg font-serif font-black text-primary leading-tight mt-0.5">
              Student Council
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((l) => {
            const isActive = location.pathname === l.path;
            return (
              <Link 
                key={l.path} 
                to={l.path}
                className={`relative text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 py-1 ${
                  isActive ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Portal CTA Action Button */}
        <div className="hidden lg:flex items-center gap-3">
          {user && (
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-bold uppercase tracking-widest text-[9px] px-5 py-4 rounded-lg shadow-md transition-colors" asChild>
              <Link to="/portal">Dashboard</Link>
            </Button>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button 
          className="lg:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none" 
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {open && (
        <div className="lg:hidden border-t border-border/40 bg-background px-6 py-4 space-y-3 shadow-lg absolute w-full left-0">
          <div className="flex flex-col gap-3">
            {navLinks.map((l) => {
              const isActive = location.pathname === l.path;
              return (
                <Link 
                  key={l.path} 
                  to={l.path}
                  onClick={() => setOpen(false)}
                  className={`text-sm font-bold uppercase tracking-wider py-1.5 border-l-2 pl-3 transition-colors ${
                    isActive ? "border-gold text-primary bg-primary/5" : "border-transparent text-muted-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
             })}
             {user && (
               <>
                 <div className="h-px bg-border/40 my-2" />
                 <Button className="w-full bg-primary text-white font-bold uppercase tracking-widest text-xs py-3 rounded-lg" asChild onClick={() => setOpen(false)}>
                   <Link to="/portal">Dashboard</Link>
                 </Button>
               </>
             )}
          </div>
        </div>
      )}
    </nav>
  );
}
