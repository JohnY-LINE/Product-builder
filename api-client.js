(() => {
  async function tryJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function submitSubmission(payload, files) {
    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));
    if (files?.spec?.blob) fd.append("spec", files.spec.blob, files.spec.filename || "spec.json");
    if (files?.preview?.blob) fd.append("preview", files.preview.blob, files.preview.filename || "preview.jpg");
    if (files?.print?.blob) fd.append("production", files.print.blob, files.print.filename || "production.png");

    const res = await fetch("/api/submissions", { method: "POST", body: fd });
    if (!res.ok) throw new Error(`submit failed (${res.status})`);
    return (await tryJson(res)) || {};
  }

  async function exportProduction(spec) {
    const res = await fetch("/api/editor/export/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spec)
    });
    if (!res.ok) throw new Error(`export production failed (${res.status})`);
    return (await tryJson(res)) || {};
  }

  async function saveTemplateConfig(config) {
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error(`save template failed (${res.status})`);
    return (await tryJson(res)) || {};
  }

  async function updateSubmissionStatus(submissionId, patch) {
    const res = await fetch(`/api/admin/inbox/${submissionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (!res.ok) throw new Error(`status update failed (${res.status})`);
    return (await tryJson(res)) || {};
  }

  window.MockupApi = {
    submitSubmission,
    exportProduction,
    saveTemplateConfig,
    updateSubmissionStatus
  };
})();
