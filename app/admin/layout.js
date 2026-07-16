import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminGuard from "@/components/admin/AdminGuard";
import { LanguageProvider } from "@/components/admin/LanguageContext";
import { StudentProvider } from "@/components/admin/StudentContext";
import { StudentHistoryProvider } from "@/components/admin/StudentHistoryContext";
import { CompanyProvider } from "@/components/admin/CompanyContext";
import { JobProvider } from "@/components/admin/JobContext";
import { MappingProvider } from "@/components/admin/MappingContext";
import { InternshipProvider } from "@/components/admin/InternshipContext";
import { UserProvider } from "@/components/admin/UserContext";
import { NewsProvider } from "@/components/admin/NewsContext";
import { ActivitiesProvider } from "@/components/admin/ActivitiesContext";
import { ScholarshipTypesProvider } from "@/components/admin/ScholarshipTypesContext";
import { BannerProvider } from "@/components/admin/BannerContext";
import { ContactProvider } from "@/components/admin/ContactContext";
import { FaqProvider } from "@/components/admin/FaqContext";
import { SplashProvider } from "@/components/admin/SplashContext";
import { AlumniProvider } from "@/components/admin/AlumniContext";
import { DocumentProvider } from "@/components/admin/DocumentContext";
import { PageTitleProvider } from "@/components/admin/PageTitleContext";

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
