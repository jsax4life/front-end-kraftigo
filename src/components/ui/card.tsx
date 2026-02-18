import Image from "next/image";

interface CardProps {
  img: string;
  title: string;
  val: string;
}

const Card = ({ img, title, val }: CardProps) => {
  return (
    <div className="bg-white rounded-[10px] flex-1 min-w-25 px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6 space-y-3 sm:space-y-4 shadow-sm">
      <Image
        src={img}
        alt={title}
        width={100}
        height={100}
        className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8"
      />
      <div>
        <p className="font-poppins text-[#00000099] text-[12px] sm:text-[14px] lg:text-[16px]">
          {title}
        </p>
        <p className="font-gerat font-semibold text-[20px] sm:text-[24px] lg:text-[28px]">
          {val}
        </p>
      </div>
    </div>
  );
};

export default Card;
