import DesktopNavigation from "@/components/desktop/Navigation";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <DesktopNavigation />
      <main className="min-h-screen pb-28">
        {children}
      </main>
    </>
  );
}
