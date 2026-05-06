type StatusToastVariant = "error" | "loading" | "success" | "status";

export function StatusToast({
  children,
  title,
  variant,
}: {
  children: string;
  title: string;
  variant?: StatusToastVariant;
}) {
  const nextVariant = variant ?? inferVariant(children);
  const isError = nextVariant === "error";
  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={`status-toast status-toast-${nextVariant}`}
      role={isError ? "alert" : "status"}
    >
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

function inferVariant(message: string): StatusToastVariant {
  const normalized = message.toLowerCase();
  if (normalized.includes("failed") || normalized.includes("error") || normalized.includes("invalid")) return "error";
  if (normalized.includes("loading") || normalized.includes("checking")) return "loading";
  if (normalized.includes("created") || normalized.includes("updated") || normalized.includes("saved") || normalized.includes("copied")) return "success";
  return "status";
}
