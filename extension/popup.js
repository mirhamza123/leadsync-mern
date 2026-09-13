const API_URL = "http://localhost:5000/api/leads/extract";
const comments = document.querySelector("#comments");
const autoExtractButton = document.querySelector("#auto-extract");
const manualSendButton = document.querySelector("#manual-send");
const status = document.querySelector("#status");

function setBusy(isBusy) {
  autoExtractButton.disabled = isBusy;
  manualSendButton.disabled = isBusy;
}

async function sendLeads(payload) {
  setBusy(true);
  status.textContent = "Sending...";
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    status.textContent = `${data.leads.length} lead(s) captured.`;
    return true;
  } catch (error) {
    status.textContent = `Error: ${error.message}. Check that LeadSync API is running and CORS is allowed.`;
    return false;
  } finally {
    setBusy(false);
  }
}

autoExtractButton.addEventListener("click", async () => {
  status.textContent = "Reading LinkedIn comments...";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id || !tab.url?.includes("linkedin.com")) {
      throw new Error("Open a LinkedIn page first");
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "SCRAPE_PAGE",
    });
    if (!response?.leads?.length)
      throw new Error("No comments found on this page");
    await sendLeads({ structuredLeads: response.leads });
  } catch (error) {
    status.textContent = `Error: ${error.message}. Refresh the LinkedIn page if needed.`;
  }
});

manualSendButton.addEventListener("click", async () => {
  const rawText = comments.value.trim();
  if (!rawText) {
    status.textContent = "Paste at least one comment first.";
    return;
  }
  if (await sendLeads({ rawText })) comments.value = "";
});
