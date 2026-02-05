import Image from "next/image";

const loader = () => {
  return (
    <div className="flex justify-center mb-8 relative z-20 mt-20">
      <Image
        src="/craft.svg"
        alt="kraftigö logo"
        width={173}
        height={58}
        className="w-32 sm:w-40 h-auto object-contain"
      />
    </div>
  );
};

export default loader;
