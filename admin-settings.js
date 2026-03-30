const openSettingsBtn = document.getElementById("openSettingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsModal");
const settingsModal = document.getElementById("settingsModal");
const settingsForm = document.getElementById("settings-form");
const settingsMessage = document.getElementById("settingsMessage");

const storeNameInput = document.getElementById("storeName");
const supportEmailInput = document.getElementById("supportEmail");
const phoneSettingsInput = document.getElementById("phone");
const addressInput = document.getElementById("address");
const currencyInput = document.getElementById("currency");
const footerTextInput = document.getElementById("footerText");
const facebookInput = document.getElementById("facebook");
const instagramInput = document.getElementById("instagram");
const tiktokInput = document.getElementById("tiktok");
const twitterInput = document.getElementById("twitter");
const whatsappInput = document.getElementById("whatsapp");

const heroTitleInput = document.getElementById("heroTitle");
const heroSubtitleInput = document.getElementById("heroSubtitle");
const supportHeadlineInput = document.getElementById("supportHeadline");
const supportTextInput = document.getElementById("supportText");
const homepageSupportEmailInput = document.getElementById("homepageSupportEmail");
const supportInstagramInput = document.getElementById("supportInstagram");
const supportTwitterInput = document.getElementById("supportTwitter");

// =====================
// MODAL HELPERS
// =====================
function closeSettingsModal() {
  settingsModal?.classList.add("hidden");
  document.getElementById("overlay")?.classList.add("hidden");
}

openSettingsBtn?.addEventListener("click", () => {
  settingsModal?.classList.remove("hidden");
  document.getElementById("overlay")?.classList.remove("hidden");
  loadStoreSettings();
});

closeSettingsBtn?.addEventListener("click", closeSettingsModal);

// =====================
// LOAD STORE SETTINGS
// =====================
async function loadStoreSettings() {
  try {
    const data = await apiFetch("/settings");

    if (!data.success || !data.settings) {
      throw new Error(data.message || "Failed to load settings");
    }

    const settings = data.settings;

    if (storeNameInput) storeNameInput.value = settings.storeName || "";
    if (supportEmailInput) supportEmailInput.value = settings.supportEmail || "";
    if (phoneSettingsInput) phoneSettingsInput.value = settings.phone || "";
    if (addressInput) addressInput.value = settings.address || "";
    if (currencyInput) currencyInput.value = settings.currency || "USD";
    if (footerTextInput) footerTextInput.value = settings.footerText || "";

    if (facebookInput) facebookInput.value = settings.socialLinks?.facebook || "";
    if (instagramInput) instagramInput.value = settings.socialLinks?.instagram || "";
    if (tiktokInput) tiktokInput.value = settings.socialLinks?.tiktok || "";
    if (twitterInput) twitterInput.value = settings.socialLinks?.twitter || "";
    if (whatsappInput) whatsappInput.value = settings.socialLinks?.whatsapp || "";

    if (heroTitleInput) heroTitleInput.value = settings.homepage?.heroTitle || "";
    if (heroSubtitleInput) heroSubtitleInput.value = settings.homepage?.heroSubtitle || "";
    if (supportHeadlineInput) supportHeadlineInput.value = settings.homepage?.supportHeadline || "";
    if (supportTextInput) supportTextInput.value = settings.homepage?.supportText || "";
    if (homepageSupportEmailInput) homepageSupportEmailInput.value = settings.homepage?.supportEmail || "";
    if (supportInstagramInput) supportInstagramInput.value = settings.homepage?.supportInstagram || "";
    if (supportTwitterInput) supportTwitterInput.value = settings.homepage?.supportTwitter || "";

    if (settingsMessage) {
      settingsMessage.textContent = "";
    }
  } catch (err) {
    console.error("Failed to load store settings:", err);

    if (settingsMessage) {
      settingsMessage.textContent = "Failed to load settings";
      settingsMessage.style.color = "#b91c1c";
    }
  }
}

// =====================
// SAVE STORE SETTINGS
// =====================
settingsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const res = await window.adminApiFetch("/settings", {
      method: "PUT",
      body: JSON.stringify({
        storeName: storeNameInput?.value || "",
        supportEmail: supportEmailInput?.value || "",
        phone: phoneSettingsInput?.value || "",
        address: addressInput?.value || "",
        currency: currencyInput?.value || "USD",
        footerText: footerTextInput?.value || "",
        facebook: facebookInput?.value || "",
        instagram: instagramInput?.value || "",
        tiktok: tiktokInput?.value || "",
        twitter: twitterInput?.value || "",
        whatsapp: whatsappInput?.value || "",
        heroTitle: heroTitleInput?.value || "",
        heroSubtitle: heroSubtitleInput?.value || "",
        supportHeadline: supportHeadlineInput?.value || "",
        supportText: supportTextInput?.value || "",
        homepageSupportEmail: homepageSupportEmailInput?.value || "",
        supportInstagram: supportInstagramInput?.value || "",
        supportTwitter: supportTwitterInput?.value || ""
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      settingsMessage.textContent = data.message || "Failed to save settings";
      settingsMessage.style.color = "#b91c1c";
      return;
    }

    settingsMessage.textContent = "Store settings saved successfully";
    settingsMessage.style.color = "#166534";
  } catch (err) {
    console.error(err);

    settingsMessage.textContent = "Server error";
    settingsMessage.style.color = "#b91c1c";
  }
});