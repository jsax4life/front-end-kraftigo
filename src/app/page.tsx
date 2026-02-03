import Image from "next/image";

const page = () => {
  return (
    <main className="relative w-full h-full overflow-hidden flex items-center justify-center">
      <div className="z-10">
        <Image
          src="./craft.svg"
          alt="logo"
          width={244}
          height={79}
          className="-mt-30"
        />
      </div>
      <div className="absolute z-0 -bottom-10 left-0 w-full overflow-hidden">
        <Image src="./bottom.svg" alt="logo" width={410} height={350} />
      </div>
    </main>
  );
};

export default page;
