import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import ScrollToTop from "@/components/public/ScrollToTop";
import { PublicLanguageProvider } from "@/components/public/PublicLanguageContext";
import { NewsProvider } from "@/components/admin/NewsContext";
import { ActivitiesProvider } from "@/components/admin/ActivitiesContext";
import { ContactProvider } from "@/components/admin/ContactContext";

export default function PublicLayout({ children }) {
  return (
    <ContactProvider>
    <ActivitiesProvider>
    <NewsProvider>
      <PublicLanguageProvider>
        <ScrollToTop />
        <PublicHeader />
        <main className="flex-1 fade-in">{children}</main>
        <PublicFooter />
      </PublicLanguageProvider>
    </NewsProvider>
    </ActivitiesProvider>
    </ContactProvider>
  );
}
