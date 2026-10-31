import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function BookServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full min-h-screen bg-white pb-24 md:pb-0">
      <div className="w-full px-4 sm:px-0 pt-0 md:pt-6">
        <div className="hidden md:block max-w-4xl mx-auto">
          <Navbar />
        </div>
      </div>
      
      {children}

      <div className="hidden md:block max-w-4xl mx-auto mt-0 md:mt-20">
        <Footer />
      </div>
    </div>
  );
}
