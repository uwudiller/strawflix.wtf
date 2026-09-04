// The Strawflix wordmark: lowercase "strawflix" with a gold ".uwu" suffix.
// Monochrome everywhere except the gold ".uwu".

export function Wordmark({
  size = 19,
  gold = true,
}: {
  size?: number;
  gold?: boolean;
}) {
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      strawflix
      {gold ? (
        <span style={{ color: "var(--gold)" }}>.uwu</span>
      ) : (
        <span style={{ opacity: 0.55 }}>.uwu</span>
      )}
    </span>
  );
}