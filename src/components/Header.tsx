import { Link, useLocation } from "@tanstack/react-router";
import { Activity, Map, Coffee, MessageCircle, ArrowUpRight, Shield } from "lucide-react";
import { Logo } from "./Logo";

const FAN_NAV = [
  { to: "/", label: "Home", icon: Activity },
  { to: "/map", label: "Map", icon: Map },
  { to: "/queues", label: "Queues", icon: Activity },
  { to: "/order", label: "Order", icon: Coffee },
  { to: "/upgrades", label: "Upgrade", icon: ArrowUpRight },
  { to: "/assistant", label: "Assistant", icon: MessageCircle },
] as const;

export function Header() {
  const loc = useLocation();
  const isOps = loc.pathname.startsWith("/ops");
  if (isOps) return null;

  return (
    <header className="sticky top-2 z-40 px-2 md:px-4 mb-4">
      <div className="glass-panel mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        <Link to="/" className="flex items-center gap-2 relative z-10 transition-transform duration-300 hover:scale-105 group">
          <Logo className="h-10 w-10" />
          <span className="text-xl font-extrabold tracking-tight text-foreground glow-text">VenueIQ</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 relative z-10">
          {FAN_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? loc.pathname === "/"
                : loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-300 ${
                  active
                    ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5 border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/auth"
          className="flex items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors relative z-10"
        >
          <Shield className="h-3.5 w-3.5" />
          Ops
        </Link>
      </div>
      {/* Mobile nav */}
      <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-2 mt-2">
        <div className="glass flex items-center gap-1 rounded-full p-1 mx-auto max-w-full">
          {FAN_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === "/"
                ? loc.pathname === "/"
                : loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                  active
                    ? "bg-primary/20 text-primary glow-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className={active ? "block" : "hidden sm:block"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
