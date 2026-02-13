import Image from "next/image";
import Loader from "@/componets/ui/loader";

const UserLoad = () => {
  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto text-center space-y-8 sm:space-y-12">
        {/* Animated Logo Loader */}
        <Loader />

        {/* Decorative Bottom Image */}
        <div className="absolute z-0 -bottom-10 left-0 w-full overflow-hidden">
          <Image
            src="./bottom.svg"
            alt="decoration"
            width={410}
            height={350}
            className="w-full h-auto max-w-md mx-auto"
          />
        </div>
      </div>
    </main>
  );
};

export default UserLoad;
