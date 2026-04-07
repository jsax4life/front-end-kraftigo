interface ServiceRadiusProps {
  radius: number;
  setRadius: (radius: number) => void;
}

const ServiceRadius = ({ radius, setRadius }: ServiceRadiusProps) => {
  return (
    <div className="space-y-4 pt-2 pb-2">
      <div className="flex items-center justify-between">
        <label className="text-[14px] font-poppins text-gray-800">
          Service Area Radius
        </label>
        <span className="text-[14px] font-poppins text-brand-orange font-bold bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
          {radius} km
        </span>
      </div>
      <p className="text-[12px] font-poppins text-gray-500 -mt-2">
        How far are you willing to travel for a job?
      </p>
      <div className="relative pt-2 pb-6 px-1 mt-2">
        {/* Empty Background Track */}
        <div className="w-full h-2 bg-[#EAECF0] rounded-lg absolute top-3 left-0 pointer-events-none" />

        {/* Filled Track Overlay */}
        <div
          className="h-2 bg-brand-orange rounded-lg absolute top-3 left-0 pointer-events-none"
          style={{ width: `${((radius - 1) / 99) * 100}%` }}
        />

        {/* Colored Thumb Visual */}
        <div
          className="w-6 h-6 bg-brand-orange rounded-full shadow-md absolute top-1 pointer-events-none border-2 border-white"
          style={{
            left: `calc(${((radius - 1) / 99) * 100}% - ${(radius / 100) * 12 + ((100 - radius) / 100) * 12}px)`,
          }}
        />

        {/* Invisible Native Slider for pure functionality */}
        <input
          type="range"
          min="1"
          max="100"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full h-6 opacity-0 cursor-pointer absolute top-1 left-0 z-10 m-0"
        />

        <div className="flex justify-between text-[11px] text-gray-400 mt-6 font-poppins font-medium pt-2">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceRadius;
