import { isSupportedCountry, SUPPORTED_COUNTRIES } from "@/lib/countries";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { redirect } from "next/navigation";

type CountryLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_COUNTRIES.map((country) => ({
    country,
  }));
}

export default async function CountryLayout({
  children,
  params,
}: CountryLayoutProps) {
  const { country } = await params;

  if (!isSupportedCountry(country)) {
    redirect("/pe");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader country={country} />
      <main className="site-main flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
