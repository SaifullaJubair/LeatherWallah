// Standard switch — visible ON / OFF pill. Replaces the old peer-checked
// markup that rendered as invisible/clipped in several places (variation
// axis toggle, per-row Active toggle).

const ToggleSwitch = ({ checked, onChange, label = "", size = "md", disabled = false }) => {
  const sizes = {
    sm: { track: "w-9 h-5", knob: "w-4 h-4", translate: "translate-x-4" },
    md: { track: "w-11 h-6", knob: "w-5 h-5", translate: "translate-x-5" },
  };
  const s = sizes[size] || sizes.md;
  return (
    <label
      className={`inline-flex items-center gap-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <span
        className={`relative inline-flex ${s.track} items-center rounded-full transition-colors ${
          checked ? "bg-primaryColor" : "bg-gray-300"
        }`}
      >
        <input
          type="checkbox"
          className="sr-only"
          checked={!!checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={`inline-block ${s.knob} transform rounded-full bg-white shadow ring-1 ring-gray-300 transition-transform ${
            checked ? s.translate : "translate-x-0.5"
          }`}
        />
      </span>
      {label && (
        <span className={`text-sm ${checked ? "text-gray-800" : "text-gray-500"}`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default ToggleSwitch;
