import Image from "next/image";

const Footer = () => {
  return (
    <div className="border-t border-[#0000001A] py-4 flex items-center justify-between">
      <ul className="flex text-[12px] items-center gap-4">
        <li>Home</li>
        <li>About Us</li>
        <li>Privacy Policy</li>
        <li>Contact Us</li>
      </ul>
      <Image
        src="/craft.svg"
        alt="kraftigö logo"
        width={108}
        height={58}
        priority
        className="w-28 h-auto object-contain"
      />
    </div>
  );
};

export default Footer;
