export const publicNav = [
  { labelKey: "nav.home",        href: "/" },
  { labelKey: "nav.news",          href: "/news" },
  { labelKey: "nav.marketplace", href: "/marketplace" },
  { labelKey: "nav.documents",   href: "/documents" },
  // { labelKey: "nav.scholarship", href: "/scholarship" },
  { labelKey: "nav.about",       href: "/about" },
  { labelKey: "nav.contact",     href: "/contact" },
];

export const adminNav = [
  {
    label: "Main Menu",
    href: "/admin",
    icon: "🏠",
  },
  {
    label: "Student Management",
    href: "/admin/students",
    icon: "🎓",
    children: [
      { label: "Dashboard", href: "/admin/students" },
      { label: "Students", href: "/admin/students/list" },
      { label: "Alumni", href: "/admin/students/alumni" },
      // { label: "Scholarship", href: "/admin/students/scholarship" },
      // { label: "Documents", href: "/admin/students/documents" },
    ],
  },
  {
    label: "Marketplace",
    href: "/admin/marketplace",
    icon: "💼",
    children: [
      { label: "Dashboard", href: "/admin/marketplace" },
      { label: "Job Positions", href: "/admin/marketplace/job-positions" },
      { label: "Applications", href: "/admin/marketplace/applications" },
    ],
  },
  {
    label: "Company Management",
    href: "/admin/companies",
    icon: "🏢",
    children: [
      { label: "Dashboard", href: "/admin/companies" },
      { label: "Companies", href: "/admin/companies/list" },
    ],
  },
  {
    label: "Information Management",
    href: "/admin/information/news",
    icon: "📋",
    children: [
      { label: "News", href: "/admin/information/news" },
      // {
      //   label: "Scholarship Types",
      //   href: "/admin/information/scholarship-types",
      // },
      { label: "Banner", href: "/admin/information/banner" },
      { label: "Contact Us", href: "/admin/information/contact" },
      { label: "FAQ", href: "/admin/information/faq" },
      { label: "Documents", href: "/admin/information/documents" },
      { label: "Splash", href: "/admin/information/splash" },
    ],
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: "👥",
  },
];
