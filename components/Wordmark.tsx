// The Strawflix wordmark: lowercase "strawflix" with a red "wtf" suffix.
// Monochrome everywhere except the red "wtf".

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
        <span style={{ color: "var(--accent)" }}>.wtf</span>
      ) : (
        <span style={{ opacity: 0.55 }}>.wtf</span>
      )}
    </span>
  );
}