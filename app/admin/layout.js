import AdminSidebar from "@/components/admin/ui/AdminSidebar";
import AdminHeader from "@/components/admin/ui/AdminHeader";
import AdminGuard from "@/components/admin/ui/AdminGuard";
import { LanguageProvider } from "@/components/admin/contexts/LanguageContext";
import { StudentProvider } from "@/components/admin/contexts/StudentContext";
import { StudentHistoryProvider } from "@/components/admin/contexts/StudentHistoryContext";
import { CompanyProvider } from "@/components/admin/contexts/CompanyContext";
import { JobProvider } from "@/components/admin/contexts/JobContext";
import { MappingProvider } from "@/components/admin/contexts/MappingContext";
import { InternshipProvider } from "@/components/admin/contexts/InternshipContext";
import { UserProvider } from "@/components/admin/contexts/UserContext";
import { NewsProvider } from "@/components/admin/contexts/NewsContext";
import { ActivitiesProvider } from "@/components/admin/contexts/ActivitiesContext";
import { ScholarshipTypesProvider } from "@/components/admin/contexts/ScholarshipTypesContext";
import { BannerProvider } from "@/components/admin/contexts/BannerContext";
import { ContactProvider } from "@/components/admin/contexts/ContactContext";
import { FaqProvider } from "@/components/admin/contexts/FaqContext";
import { SplashProvider } from "@/components/admin/contexts/SplashContext";
import { AlumniProvider } from "@/components/admin/contexts/AlumniContext";
import { DocumentProvider } from "@/components/admin/contexts/DocumentContext";
import { PageTitleProvider } from "@/components/admin/contexts/PageTitleContext";

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <LanguageProvider>
      <StudentHistoryProvider>
      <StudentProvider>
      <AlumniProvider>
      <CompanyProvider>
      <JobProvider>
      <MappingProvider>
      <InternshipProvider>
      <UserProvider>
      <NewsProvider>
      <ActivitiesProvider>
      <ScholarshipTypesProvider>
      <BannerProvider>
      <ContactProvider>
      <FaqProvider>
      <SplashProvider>
      <DocumentProvider>
        <PageTitleProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            <AdminSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <AdminHeader />
              <main className="flex-1 overflow-y-auto fade-in">{children}</main>
            </div>
          </div>
        </PageTitleProvider>
      </DocumentProvider>
      </SplashProvider>
      </FaqProvider>
      </ContactProvider>
      </BannerProvider>
      </ScholarshipTypesProvider>
      </ActivitiesProvider>
      </NewsProvider>
      </UserProvider>
      </InternshipProvider>
      </MappingProvider>
      </JobProvider>
      </CompanyProvider>
      </AlumniProvider>
      </StudentProvider>
      </StudentHistoryProvider>
      </LanguageProvider>
    </AdminGuard>
  );
}
