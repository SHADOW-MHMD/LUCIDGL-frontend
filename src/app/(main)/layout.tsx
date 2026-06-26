import Navigation from "@/components/Navigation";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navigation />
      <main className="pt-20 pb-24 px-4 max-w-5xl mx-auto">
        {children}
      </main>
    </>
  );
}
