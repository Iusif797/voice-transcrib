"use client";

interface Action {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "ghost" | "danger";
}

const toneClasses: Record<NonNullable<Action["tone"]>, string> = {
  primary:
    "bg-white text-black hover:bg-white/90 disabled:bg-white/30 disabled:text-white/50",
  ghost:
    "bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 disabled:opacity-40",
  danger:
    "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-400/20 disabled:opacity-40",
};

export const ActionBar = ({ actions }: { actions: Action[] }) => (
  <div className="flex flex-wrap gap-2 justify-center">
    {actions.map((action) => (
      <button
        key={action.label}
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition disabled:cursor-not-allowed ${toneClasses[action.tone ?? "ghost"]}`}
      >
        {action.label}
      </button>
    ))}
  </div>
);
