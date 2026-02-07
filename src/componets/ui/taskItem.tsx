import { MapPin } from "lucide-react";

interface TaskItemProps {
  time: string;
  title: string;
  client: string;
  location: string;
  status: string;
  statusColor: string;
  dotColor: string;
  isLast?: boolean;
}

const TaskItem = ({
  time,
  title,
  client,
  location,
  status,
  statusColor,
  dotColor,
  isLast = false,
}: TaskItemProps) => {
  return (
    <div className="flex gap-3 sm:gap-4">
      {/* Timeline Dot */}
      <div className="flex flex-col items-center pt-1">
        <div
          className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-md ${dotColor} flex-shrink-0`}
        ></div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 mt-2"
            style={{
              background:
                "repeating-linear-gradient(to bottom, #9CA3AF 0px, #9CA3AF 4px, transparent 4px, transparent 8px)",
            }}
          ></div>
        )}
      </div>

      {/* Task Card */}
      <div className="flex-1 w-full">
        <p className="text-[12px] sm:text-[14px] font-poppins text-gray-600 mb-3 mt-2">
          {time}
        </p>
        <div className="w-full bg-[#F6F6F6] border border-[#0000001A] rounded-xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-[16px] sm:text-[18px] font-gerat font-bold">
              {title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-[11px] sm:text-[12px] font-poppins whitespace-nowrap ${statusColor}`}
            >
              {status}
            </span>
          </div>
          <p className="text-[13px] sm:text-[14px] font-poppins text-gray-700 mb-2">
            {client}
          </p>
          <div className="flex items-center gap-2 text-[13px] sm:text-[14px] font-poppins text-gray-600">
            <MapPin size={16} className="shrink-0" />
            <p>{location}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
