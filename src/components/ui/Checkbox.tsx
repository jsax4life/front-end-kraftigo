interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const Checkbox = ({ checked, onChange, label }: CheckboxProps) => {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 mt-1 cursor-pointer shrink-0 appearance-none border-2 border-brand-orange rounded checked:bg-brand-orange checked:border-brand-orange relative
          after:content-[''] after:absolute after:left-1.25 after:top-px after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
      />
      <span className="text-[14px] font-qurova text-gray-700 mt-1 lg:mt-2">
        {label}
      </span>
    </label>
  );
};
