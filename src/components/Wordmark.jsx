// Text wordmark shared with bingwake.com: BINGWA in the surrounding colour, KE in yellow.
export default function Wordmark({ className = "", tone = "light", suffix }) {
  return (
    <span
      aria-label="Bingwake"
      className={`inline-flex items-baseline gap-2 whitespace-nowrap font-display font-bold leading-none tracking-[-0.035em] ${className}`}
    >
      <span aria-hidden="true" className={tone === "light" ? "text-white" : "text-bw-green"}>
        BINGWA<span className="text-brand">KE</span>
      </span>
      {suffix && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">{suffix}</span>
      )}
    </span>
  );
}
