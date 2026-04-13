export default function FeatureCard({
  tag,
  title,
  description,
}: {
  tag: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        background: "#111111",
        padding: "32px 28px",
        transition: "background 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "#161616";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "#111111";
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#3a3a3a",
          letterSpacing: "0.1em",
          marginBottom: "16px",
          textTransform: "uppercase",
        }}
      >
        {tag}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          color: "#ccc",
          marginBottom: "12px",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "#555",
          lineHeight: "1.8",
        }}
      >
        {description}
      </div>
    </div>
  );
}
