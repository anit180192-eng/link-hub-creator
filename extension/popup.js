const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
function toHtml(nodes) {
  return "<DL>" + nodes.map((n) => n.url
    ? `<DT><A HREF="${esc(n.url)}">${esc(n.title || n.url)}</A>`
    : `<DT><H3${n.id === "1" ? ' PERSONAL_TOOLBAR_FOLDER="true"' : ""}>${esc(n.title || "Folder")}</H3>${toHtml(n.children || [])}`).join("") + "</DL>";
}
document.getElementById("go").onclick = async () => {
  const s = document.getElementById("s");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/\/dashboard/.test(tab.url || "")) { s.textContent = "Open your Landing Page Builder dashboard first."; return; }
    const tree = await chrome.bookmarks.getTree();
    const html = toHtml(tree[0].children || []);
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: "MAIN", args: [html],
      func: (h) => window.postMessage({ type: "LPB_BOOKMARKS", html: h }, window.location.origin) });
    s.textContent = "Sent! Check your dashboard.";
  } catch (e) { s.textContent = "Couldn't send: " + e.message; }
};
