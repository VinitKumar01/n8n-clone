import Connector from "./Connector";
import NodePill from "./NodePill";

export default function FlowPreview() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0px",
        flexWrap: "nowrap",
        overflowX: "auto",
      }}
    >
      <NodePill label="⏱ scheduler" />
      <Connector />
      <NodePill label="✦ gemini" />
      <Connector />
      <NodePill label="⑂ merge" />
      <Connector />
      <NodePill label="✉ email" />
    </div>
  );
}
