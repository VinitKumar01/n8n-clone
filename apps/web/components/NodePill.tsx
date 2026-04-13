export default function NodePill({ label }: { label: string }) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #2e2e2e",
        borderRadius: "12px",
        padding: "8px 14px",
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "#777",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}
