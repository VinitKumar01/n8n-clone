export default function DotGrid() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle,#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#2a2a2a_1px,transparent_1px)]"
      style={{
        backgroundSize: "28px 28px",
        maskImage:
          "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }}
    />
  );
}
