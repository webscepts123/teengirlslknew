import { SRI_LANKA_LOCATIONS, SRI_LANKA_DISTRICTS } from "./sri-lanka-locations.js";
import { validateRegistration } from "./customer-registration-rules.js";

const form = document.getElementById("register-form");

// Searchable picker: a text input that filters a fixed option list. The input
// only keeps a value that matches an option, so the server always receives a
// real district/city name.
function createCombo(root, { getOptions, onSelect }) {
  const input = root.querySelector("input");
  const list = root.querySelector(".tgl-combo-list");
  let activeIndex = -1;
  let visible = [];
  let selectedValue = input.value;

  const isOpen = () => !list.hidden;

  function render() {
    const query = input.value.trim().toLowerCase();
    const options = getOptions();
    visible = query && !options.includes(input.value) ? options.filter((o) => o.toLowerCase().includes(query)) : options;
    list.replaceChildren();

    if (!visible.length) {
      const empty = document.createElement("li");
      empty.className = "tgl-combo-empty";
      empty.textContent = "No matches found";
      list.append(empty);
      return;
    }

    visible.forEach((option, index) => {
      const item = document.createElement("li");
      item.className = "tgl-combo-option" + (index === activeIndex ? " is-active" : "");
      item.id = `${list.id}-${index}`;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option === input.value));
      item.textContent = option;
      // mousedown fires before the input blurs, so the pick isn't lost.
      item.addEventListener("mousedown", (event) => {
        event.preventDefault();
        choose(option);
      });
      list.append(item);
    });
  }

  function open() {
    if (input.disabled) return;
    activeIndex = -1;
    render();
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function choose(option) {
    const changed = selectedValue !== option;
    input.value = option;
    selectedValue = option;
    close();
    clearError(input.name);
    if (changed) onSelect?.(option);
  }

  function moveActive(step) {
    if (!visible.length) return;
    activeIndex = (activeIndex + step + visible.length) % visible.length;
    render();
    const active = list.children[activeIndex];
    active?.scrollIntoView({ block: "nearest" });
    if (active) input.setAttribute("aria-activedescendant", active.id);
  }

  input.addEventListener("focus", open);
  input.addEventListener("click", open);
  input.addEventListener("input", () => {
    if (selectedValue && input.value !== selectedValue) {
      selectedValue = "";
      onSelect?.("");
    }
    activeIndex = -1;
    if (!isOpen()) open();
    else render();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") { event.preventDefault(); isOpen() ? moveActive(1) : open(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); moveActive(-1); }
    else if (event.key === "Enter" && isOpen()) {
      event.preventDefault();
      const pick = visible[activeIndex] ?? (visible.length === 1 ? visible[0] : null);
      if (pick) choose(pick);
    } else if (event.key === "Escape") close();
  });
  input.addEventListener("blur", () => {
    close();
    // Accept a typed value that matches an option ignoring case; drop anything else.
    const match = getOptions().find((o) => o.toLowerCase() === input.value.trim().toLowerCase());
    if (match) choose(match);
    else { input.value = ""; selectedValue = ""; onSelect?.(""); }
  });

  return { input };
}

function fieldFor(name) {
  return form.querySelector(`[data-error-for="${name}"]`)?.closest(".tgl-reg-field");
}

function setError(name, message) {
  const slot = form.querySelector(`[data-error-for="${name}"]`);
  if (!slot) return;
  slot.textContent = message ?? "";
  fieldFor(name)?.classList.toggle("is-invalid", Boolean(message));
}

function clearError(name) {
  setError(name, "");
}

if (form) {
  const cityRoot = form.querySelector('[data-combo="city"]');
  const cityInput = cityRoot.querySelector("input");
  const districtInput = form.querySelector('[data-combo="district"] input');

  const syncCityState = () => {
    const hasDistrict = Boolean(SRI_LANKA_LOCATIONS[districtInput.value]);
    cityInput.disabled = !hasDistrict;
    cityInput.placeholder = hasDistrict ? "Search and select city..." : "Select a district first";
  };

  createCombo(form.querySelector('[data-combo="district"]'), {
    getOptions: () => SRI_LANKA_DISTRICTS,
    onSelect: () => {
      cityInput.value = "";
      syncCityState();
    }
  });
  createCombo(cityRoot, { getOptions: () => SRI_LANKA_LOCATIONS[districtInput.value] ?? [] });
  syncCityState();

  // Mark fields the server rejected so their borders match the message.
  form.querySelectorAll(".tgl-field-error").forEach((slot) => {
    if (slot.textContent.trim()) slot.closest(".tgl-reg-field")?.classList.add("is-invalid");
  });

  form.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.querySelector("span").className = show ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  form.addEventListener("input", (event) => {
    if (event.target.name) clearError(event.target.name);
  });

  form.addEventListener("submit", (event) => {
    const { errors } = validateRegistration(Object.fromEntries(new FormData(form)));
    form.querySelectorAll("[data-error-for]").forEach((slot) => setError(slot.dataset.errorFor, errors[slot.dataset.errorFor]));

    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      event.preventDefault();
      form.elements[firstInvalid]?.focus();
      return;
    }
    form.querySelector('button[type="submit"]').disabled = true;
  });
}
