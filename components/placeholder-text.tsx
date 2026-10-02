export function PlaceholderText({ text }: { text: string }) {
  return text.split(/(【[^】]+】)/g).map((part, index) =>
    part.startsWith("【") ? (
      <mark className="placeholder-label" key={index}>{part}</mark>
    ) : (
      part
    ),
  );
}
