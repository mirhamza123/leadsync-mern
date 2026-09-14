const API_URL = "http://localhost:5000/api/leads/extract";
const rawInput = document.querySelector("#rawInput, #comments");
const autoExtractButton = document.querySelector("#auto-extract");
const manualSendButton = document.querySelector("#manual-send");
const status = document.querySelector("#status");

function setBusy(isBusy) {
  if (autoExtractButton) autoExtractButton.disabled = isBusy;
  if (manualSendButton) manualSendButton.disabled = isBusy;
}

function setStatus(message, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "#b91c1c" : "#15803d";
}

async function sendLeads(payload) {
  setBusy(true);
  setStatus("Sending...");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    setStatus(data.message || `${data.count || 0} lead(s) captured.`);
    return true;
  } catch (error) {
    const networkHint =
      error instanceof TypeError
        ? " Check that the LeadSync API is running on Port 5000 and CORS is allowed."
        : "";
    setStatus(`Error: ${error.message}.${networkHint}`, true);
    return false;
  } finally {
    setBusy(false);
  }
}

autoExtractButton.addEventListener("click", async () => {
  setStatus("Reading LinkedIn comments...");
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id || !tab.url || !tab.url.includes("linkedin.com")) {
      throw new Error("Open a active LinkedIn page first");
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: "SCRAPE_PAGE" },
      async (response) => {
        if (chrome.runtime.lastError) {
          setStatus(
            "Error: Refresh the LinkedIn page (F5) and try again.",
            true,
          );
          return;
        }

        if (!response?.leads?.length) {
          setStatus(
            "Error: No comments found on this page. Scroll down to load comments.",
            true,
          );
          return;
        }

        await sendLeads({ structuredLeads: response.leads });
      },
    );
  } catch (error) {
    setStatus(
      `Error: ${error.message || "Could not connect to the LinkedIn page"}. Refresh the page and try again.`,
      true,
    );
  }
});

manualSendButton.addEventListener("click", async () => {
  const rawText = rawInput?.value.trim() || "";
  if (!rawText) {
    setStatus("Paste at least one comment first.", true);
    return;
  }
  if ((await sendLeads({ rawText })) && rawInput) rawInput.value = "";
});
