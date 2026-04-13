export default function GhostButton({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "1px solid #2e2e2e",
        borderRadius: "8px",
        color: "#888",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        padding: "8px 16px",
        cursor: "pointer",
        letterSpacing: "0.05em",
        transition: "border-color 0.2s, color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#555";
        (e.currentTarget as HTMLButtonElement).style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#2e2e2e";
        (e.currentTarget as HTMLButtonElement).style.color = "#888";
      }}
    >
      {children}
    </button>
  );
}
