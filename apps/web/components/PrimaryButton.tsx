export default function PrimaryButton({
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
        background: "#ffffff",
        border: "none",
        borderRadius: "10px",
        color: "#111",
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        padding: "14px 28px",
        cursor: "pointer",
        letterSpacing: "0.04em",
        fontWeight: 600,
        whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
      }
    >
      {children}
    </button>
  );
}
