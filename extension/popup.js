const API_URL = "http://localhost:5000/api/leads/extract";
const comments = document.querySelector("#comments");
const captureButton = document.querySelector("#capture");
const status = document.querySelector("#status");

captureButton.addEventListener("click", async () => {
  const rawText = comments.value.trim();
  if (!rawText) {
    status.textContent = "Paste at least one comment first.";
    return;
  }

  captureButton.disabled = true;
  status.textContent = "Sending...";
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    comments.value = "";
    status.textContent = `${data.leads.length} lead(s) captured.`;
  } catch (error) {
    status.textContent = error.message;
  } finally {
    captureButton.disabled = false;
  }
});
