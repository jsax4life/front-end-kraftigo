import Image from "next/image";

const Notify = () => {
  const isCompleted = false;
  return (
    <div>
      {isCompleted ? (
        <div className="w-full bg-[#F6F6F6] rounded-xl px-4 py-4 sm:px-5 sm:py-5">
          <p className="font-poppins text-[14px] sm:text-[16px] text-gray-800">
            Mariah Accepted your Offer of{" "}
            <span className="font-semibold font-gerat text-brand-orange">
              €20
            </span>
          </p>
        </div>
      ) : (
        <Image src="/noti.svg" alt="taskpro" width={400} height={400} />
      )}
    </div>
  );
};

export default Notify;
