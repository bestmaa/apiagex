import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";

export function ConfirmDialog({
  cancelLabel = "Cancel",
  children,
  confirmIcon,
  confirmLabel,
  onCancel,
  onConfirm,
  title,
}: {
  cancelLabel?: string;
  children: ReactNode;
  confirmIcon?: ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="confirm-dialog"
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      <strong id={titleId}>{title}</strong>
      <p id={descriptionId}>{children}</p>
      <div>
        <button ref={cancelRef} type="button" onClick={onCancel}>{cancelLabel}</button>
        <button type="button" onClick={onConfirm}>
          {confirmIcon}
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
