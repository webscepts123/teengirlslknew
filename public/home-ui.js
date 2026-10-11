(() => {
  const hero = document.querySelector('[data-slider="hero"]');
  if (hero) {
    const slides = [...hero.querySelectorAll("[data-slide]")];
    let index = 0;
    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) =>
        slide.classList.toggle("is-active", i === index),
      );
    };
    hero.querySelector("[data-slider-prev]")?.addEventListener("click", () => show(index - 1));
    hero.querySelector("[data-slider-next]")?.addEventListener("click", () => show(index + 1));
    setInterval(() => {
      if (!document.hidden && !hero.matches(":hover")) show(index + 1);
    }, 6000);
  }

  const reviews = document.querySelector('[data-slider="reviews"]');
  const track = reviews?.querySelector(".tgl-review-track");
  if (track) {
    const step = () => (track.firstElementChild?.offsetWidth ?? 280) + 16;
    reviews.querySelector("[data-slider-prev]")?.addEventListener("click", () =>
      track.scrollBy({ left: -step(), behavior: "smooth" }),
    );
    reviews.querySelector("[data-slider-next]")?.addEventListener("click", () =>
      track.scrollBy({ left: step(), behavior: "smooth" }),
    );
  }

  const catToggle = document.querySelector("[data-cat-toggle]");
  const catMenu = document.querySelector(".tgl-cat-dropdown");
  if (catToggle && catMenu) {
    const setOpen = (open) => {
      catMenu.hidden = !open;
      catToggle.setAttribute("aria-expanded", String(open));
    };
    catToggle.addEventListener("click", () => setOpen(catMenu.hidden));
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".tgl-cat-menu")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  const countdown = document.querySelector("[data-countdown]");
  if (countdown) {
    const end = Date.now() + (2 * 3600 + 45 * 60 + 18) * 1000;
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      let left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      if (left === 0) left = 0;
      countdown.querySelector('[data-cd="h"]').textContent = pad(Math.floor(left / 3600));
      countdown.querySelector('[data-cd="m"]').textContent = pad(Math.floor((left % 3600) / 60));
      countdown.querySelector('[data-cd="s"]').textContent = pad(left % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  document.querySelector("[data-newsletter]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    form.querySelector(".tgl-news-msg").textContent =
      "Thanks for subscribing! ♡";
    form.reset();
  });
})();
