type StateMessageVariant = "empty" | "error" | "loading" | "status";

export function StateMessage({
  children,
  title,
  variant,
}: {
  children?: string;
  title: string;
  variant?: StateMessageVariant;
}) {
  const nextVariant = variant ?? inferVariant(children);
  return (
    <div className={`state-message state-message-${nextVariant}`} role={nextVariant === "error" ? "alert" : "status"}>
      <strong>{title}</strong>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

function inferVariant(message = ""): StateMessageVariant {
  const normalized = message.toLowerCase();
  if (normalized.includes("failed") || normalized.includes("error")) return "error";
  if (normalized.includes("loading")) return "loading";
  return "status";
}
