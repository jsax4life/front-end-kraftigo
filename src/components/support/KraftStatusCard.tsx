import Image from "next/image";

interface KraftStatusCardProps {
  title: string;
  artisan: string;
  date: string;
  status: "Completed" | "In Progress" | "Cancelled" | "Upcoming";
}

const statusStyles = {
  Completed: "bg-[#FFF4ED] text-[#FF6600]",
  "In Progress": "bg-[#E7F8F0] text-[#00A651]",
  Cancelled: "bg-[#FEECEB] text-[#F04438]",
  Upcoming: "bg-[#EEF2FF] text-[#3538CD]",
};

const KraftStatusCard = ({ title, artisan, date, status }: KraftStatusCardProps) => {
  return (
    <div className="bg-white border border-[#0000001A] rounded-xl p-4 flex justify-between items-start mb-3">
      <div className="space-y-1">
        <h3 className="text-[16px] font-gerat font-bold text-[#1D2939]">{title}</h3>
        <p className="text-[14px] text-[#667085] font-poppins">By {artisan}</p>
        <p className="text-[12px] text-[#98A2B3] font-poppins">
          {status === "Completed" ? "Completed" : status === "Cancelled" ? "Cancelled" : "Ordered"} on {date}
        </p>
      </div>
      <div className={`px-2 py-0.5 rounded-md text-[10px] font-semibold font-poppins ${statusStyles[status]}`}>
        {status}
      </div>
    </div>
  );
};

export default KraftStatusCard;
