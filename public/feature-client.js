export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export async function api(url, body) {
  const token = document.querySelector('[name="_csrf"]')?.value;
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body
      ? { "Content-Type": "application/json", "x-csrf-token": token || "" }
      : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok || data.success === false)
    throw new Error(data.error || "Request failed.");
  return data;
}
export function message(text) {
  if (window.showToast) window.showToast(escapeHtml(text), "fa-circle-check");
  else {
    const target = document.querySelector("[data-feature-message]");
    if (target) target.textContent = text;
    else alert(text);
  }
}
export function field(name, label, type = "text", value = "", required = true) {
  const id = "feature-" + name;
  const input =
    type === "textarea"
      ? `<textarea class="tgl-textarea" id="${id}" name="${name}" ${required ? "required" : ""}>${escapeHtml(value)}</textarea>`
      : `<input class="tgl-input" id="${id}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? "required" : ""} ${type === "number" ? 'min="0" step="0.01"' : ""}>`;
  return `<div class="tgl-form-group"><label class="tgl-form-label" for="${id}">${escapeHtml(label)}</label>${input}</div>`;
}
export function downloadCsv(records, filename) {
  const rows = records.length ? records : [{}];
  const keys = Object.keys(rows[0]);
  const quote = (value) => {
    let text =
      typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
    if (/^[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const blob = new Blob(
    [
      keys.map(quote).join(",") +
        "\n" +
        rows.map((r) => keys.map((k) => quote(r[k])).join(",")).join("\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
