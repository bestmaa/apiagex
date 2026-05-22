import { ChangeEvent, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { exportProjectTemplate, importProjectTemplate } from "../api";
import { StatusToast } from "../components/StatusToast";

export function SettingsProjectTemplate() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("Project template ready");

  async function downloadTemplate() {
    const result = await exportProjectTemplate();
    if (!result.ok || !result.template) {
      setStatus(result.error ?? "Project template export failed");
      return;
    }
    const body = JSON.stringify(result.template, null, 2);
    const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `apiagex-template-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Project template exported");
  }

  async function uploadTemplate(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const template = JSON.parse(await file.text()) as unknown;
      const result = await importProjectTemplate(template);
      if (!result.ok) {
        setStatus(result.error ?? "Project template import failed");
        return;
      }
      setStatus(`Project template imported: ${sumCounts(result.imported)} new, ${sumCounts(result.skipped)} skipped`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Project template import failed");
    }
  }

  return (
    <section aria-labelledby="settings-project-template-title" className="settings-route-panel">
      <h2 id="settings-project-template-title">Project Template</h2>
      <p>Export and import project structure without content entries, users, or tokens.</p>
      <div className="settings-panel project-template-panel">
        <button type="button" onClick={() => void downloadTemplate()}>
          <Download aria-hidden="true" size={16} />
          Export template
        </button>
        <button type="button" onClick={() => inputRef.current?.click()}>
          <Upload aria-hidden="true" size={16} />
          Import template
        </button>
        <input
          ref={inputRef}
          accept="application/json,.json"
          aria-label="Import project template JSON"
          hidden
          onChange={(event) => void uploadTemplate(event)}
          type="file"
        />
      </div>
      <StatusToast title="Project template status">{status}</StatusToast>
    </section>
  );
}

function sumCounts(counts: Record<string, number> | undefined): number {
  return Object.values(counts ?? {}).reduce((total, value) => total + value, 0);
}
