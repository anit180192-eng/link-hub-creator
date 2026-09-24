const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function toHtml(nodes) {
  return "<DL>" + nodes.map((n) => n.url
    ? `<DT><A HREF="${esc(n.url)}">${esc(n.title || n.url)}</A>`
    : `<DT><H3${n.id === "1" ? ' PERSONAL_TOOLBAR_FOLDER="true"' : ""}>${esc(n.title || "Folder")}</H3>${toHtml(n.children || [])}`).join("") + "</DL>";
}
document.getElementById("go").onclick = async () => {
  const s = document.getElementById("s");
  s.textContent = "Sending…";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) { s.textContent = "Open your Landing Page Builder dashboard first."; return; }
    const tree = await chrome.bookmarks.getTree();
    const html = toHtml(tree[0].children || []);
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, world: "MAIN", args: [html],
      func: (h) => new Promise((resolve) => {
        if (!/\/dashboard/.test(location.pathname)) return resolve(null);
        const t = setTimeout(() => { removeEventListener("message", on); resolve("The builder didn't respond. Reload the dashboard and try again."); }, 60000);
        function on(e) { if (e.source === window && e.data && e.data.type === "LPB_BOOKMARKS_RESULT") { clearTimeout(t); removeEventListener("message", on); resolve(e.data.msg); } }
        addEventListener("message", on);
        postMessage({ type: "LPB_BOOKMARKS", html: h }, location.origin);
      }) });
    const msg = results.map((r) => r.result).find(Boolean);
    s.textContent = msg ? (msg.startsWith("OK: ") ? "Done! " + msg.slice(4) : msg) : "Open your Landing Page Builder dashboard (signed in) in this tab first.";
  } catch (e) { s.textContent = "Couldn't send: " + e.message; }
};
