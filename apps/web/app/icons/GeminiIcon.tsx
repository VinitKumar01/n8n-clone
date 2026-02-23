import Image from "next/image";

export default function GeminiIcon() {
  return (
    <Image
      src={"/gemini-color.svg"}
      alt="Gemini"
      width={50}
      height={50}
      className="cursor-pointer"
    />
  );
}
