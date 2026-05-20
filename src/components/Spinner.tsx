// Dual-ring circular spinner in the brand palette.
// Border width scales with size so it stays crisp at small sizes too.
export default function Spinner({
  size = 64,
  thickness,
}: {
  size?: number;
  thickness?: number;
}) {
  const borderWidth = thickness ?? Math.max(2, Math.round(size / 16));
  return (
    <div
      className="relative shrink-0"
      style={{ height: size, width: size }}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full border-brand-100"
        style={{ borderWidth }}
      />
      <div
        className="absolute inset-0 animate-spin rounded-full border-transparent border-t-brand-700 border-r-brand-500"
        style={{ borderWidth }}
      />
    </div>
  );
}
