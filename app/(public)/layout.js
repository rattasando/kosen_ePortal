import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import ScrollToTop from "@/components/public/ScrollToTop";
import { PublicLanguageProvider } from "@/components/public/PublicLanguageContext";
import { NewsProvider } from "@/components/admin/NewsContext";
import { ActivitiesProvider } from "@/components/admin/ActivitiesContext";

export default function PublicLayout({ children }) {
  return (
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
  );
}
