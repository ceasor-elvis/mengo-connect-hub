import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import mengoBadge from "@/assets/mengo-badge.jpg";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Student Voice", path: "/student-voice" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={mengoBadge} alt="Mengo Senior School" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-serif text-lg font-bold text-primary">Mengo Councillors</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((l) => (
            <Button
              key={l.path}
              variant={location.pathname === l.path ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <Link to={l.path}>{l.label}</Link>
            </Button>
          ))}
          <Button variant="gold" size="sm" asChild>
            <Link to="/login">Councillor Login</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-background px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-2 pt-2">
            {navLinks.map((l) => (
              <Button
                key={l.path}
                variant={location.pathname === l.path ? "default" : "ghost"}
                asChild
                onClick={() => setOpen(false)}
              >
                <Link to={l.path}>{l.label}</Link>
              </Button>
            ))}
            <Button variant="gold" asChild onClick={() => setOpen(false)}>
              <Link to="/login">Councillor Login</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
