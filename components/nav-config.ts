export const mainNav = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blogs", href: "/blogs" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Templates", href: "/#templates" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Blogs", href: "/blogs" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/terms" },
      { label: "Cookies", href: "/terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/signin" },
      { label: "Create account", href: "/signup" },
      { label: "Reset password", href: "/forgot-password" },
    ],
  },
];
