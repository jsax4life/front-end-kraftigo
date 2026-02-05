import Image from "next/image";

const Page = () => {
  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-brand-yellow flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto text-center space-y-8 sm:space-y-12">
        {/* Logo */}
        <div className="flex justify-center z-10">
          <Image
            src="./taskerLogo.svg"
            alt="logo"
            width={244}
            height={79}
            className="w-48 sm:w-60 lg:w-72 h-auto"
          />
        </div>

        {/* Decorative Bottom Image */}
        <div className="absolute z-0 -bottom-10 left-0 w-full overflow-hidden">
          <Image
            src="./taskerBottom.svg"
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

export default Page;
