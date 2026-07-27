import Link from "next/link";
import { publicNav } from "@/lib/config/navigation";

export default function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-primary-dark text-white">
      <div className="page-container grid gap-6 py-8 md:grid-cols-3">
        <div>
          <p className="text-base font-bold">KOSEN Portal</p>
          <p className="mt-1.5 text-sm text-white/70">
            Empowering students with news, activities, and career opportunities through our
            integrated marketplace platform.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Quick Links
          </p>
          <ul className="mt-3 space-y-1.5">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-white/80 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Admin
          </p>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link href="/admin/students" className="text-sm text-white/80 hover:text-white">
                Student Management
              </Link>
            </li>
            <li>
              <Link href="/admin/marketplace" className="text-sm text-white/80 hover:text-white">
                Marketplace Admin
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="text-sm text-white/80 hover:text-white">
                User Management
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="page-container py-3 text-center text-xs text-white/50">
          © {new Date().getFullYear()} KOSEN Portal. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
