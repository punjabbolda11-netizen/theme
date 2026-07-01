/* Punjab Bolda — shared micro-interactions. Deferred, ~1kb. No dependencies. */
(function () {
  "use strict";

  /* ---- Scroll reveal (IntersectionObserver, batched) --------------------- */
  function initReveal() {
    var els = document.querySelectorAll(".pb-reveal:not([data-pb-bound])");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("pb-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("pb-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    els.forEach(function (el, i) {
      el.setAttribute("data-pb-bound", "");
      // Subtle stagger when a parent groups children
      if (el.hasAttribute("data-pb-stagger")) {
        el.style.setProperty("--pb-delay", (i % 6) * 90 + "ms");
      }
      io.observe(el);
    });
  }

  /* ---- AJAX quick-add (native cart, no app) ------------------------------ */
  function initQuickAdd() {
    document.querySelectorAll("form[data-pb-quickadd]:not([data-pb-bound])").forEach(function (form) {
      form.setAttribute("data-pb-bound", "");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = form.querySelector("button[type=submit]");
        var label = btn.querySelector("span");
        var original = label ? label.textContent : "";
        btn.setAttribute("aria-busy", "true");
        fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ id: form.querySelector("[name=id]").value, quantity: 1 })
        })
          .then(function (r) { return r.json(); })
          .then(function () {
            btn.removeAttribute("aria-busy");
            btn.classList.add("is-added");
            if (label) label.textContent = "Added";
            // Refresh theme cart bubble if present
            document.dispatchEvent(new CustomEvent("cart:refresh", { bubbles: true }));
            if (window.Shopify && Shopify.onCartUpdate) { /* legacy */ }
            fetch("/cart.js").then(function (r) { return r.json(); }).then(function (cart) {
              var bubble = document.querySelector(".cart-count-bubble, [data-cart-count], .cart-count");
              if (bubble) bubble.textContent = cart.item_count;
              document.dispatchEvent(new CustomEvent("pb:cart:updated", { detail: cart }));
            });
            setTimeout(function () {
              btn.classList.remove("is-added");
              if (label) label.textContent = original;
            }, 1800);
          })
          .catch(function () {
            btn.removeAttribute("aria-busy");
            window.location.href = form.querySelector("[name=id]").closest("article").querySelector("a").href;
          });
      });
    });
  }

  /* ---- Run on load + on Shopify Theme Editor section reloads ------------- */
  function boot() { initReveal(); initQuickAdd(); }

  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);

  document.addEventListener("shopify:section:load", boot);
})();
