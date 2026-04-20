"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const TitleField = ({ value, onChange }: Props) => (
  <input
    type="text"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder="Название урока"
    className="w-full bg-transparent text-center text-lg md:text-xl font-medium text-white/90 placeholder:text-white/30 outline-none border-b border-white/10 focus:border-white/30 transition pb-2"
  />
);
