/* AI Access Observatory — data-driven feed renderer */
(function () {
  "use strict";
  var MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  var DIM = {
    jobs: { label: "Jobs", hue: "#c05a36" },
    access: { label: "Access & Pricing", hue: "#c9a227" },
    infra: { label: "Infrastructure", hue: "#1a8a7a" }
  };
  var DOTMAP = {
    "dot-jobs": "#c05a36", "dot-arxiv": "#5a6472", "dot-price": "#c9a227",
    "dot-access": "#c9a227", "dot-infra": "#1a8a7a", "dot-policy": "#5a6472"
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function parseDate(label) {
    var m = /^(\d{4})$/.exec(label || "");
    if (m) return [parseInt(m[1], 10), 12, 31];
    m = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(label || "");
    if (m) {
      var mon = MONTHS[m[1][0].toUpperCase() + m[1].slice(1, 3).toLowerCase()];
      if (!mon) return [0, 0, 0];
      var now = new Date();
      var year = mon <= (now.getMonth() + 1) ? now.getFullYear() : now.getFullYear() - 1;
      return [year, mon, parseInt(m[2], 10)];
    }
    return [0, 0, 0];
  }
  function sortNewestFirst(a, b) {
    var da = parseDate(a.d), db = parseDate(b.d);
    for (var i = 0; i < 3; i++) { if (da[i] !== db[i]) return db[i] - da[i]; }
    return 0;
  }
  function dotColor(it) { return DOTMAP[it.dot] || "#94a3b8"; }
  function fmtDate(d) { return d || ""; }

  function itemHTML(it) {
    return '<div class="item"><span class="dot" style="background:' + dotColor(it) + '"></span>' +
      '<div class="tx"><a class="t" href="' + esc(it.u) + '" target="_blank" rel="noopener">' + esc(it.t) + "</a>" +
      '<span class="s">' + esc(it.s) + "</span></div>" +
      '<span class="d">' + esc(fmtDate(it.d)) + "</span></div>";
  }

  function buildColumn(key, items) {
    var col = document.createElement("div");
    col.className = "tcol";
    var head = '<div class="th"><span class="dot ' + key + '"></span>' + esc(DIM[key].label) +
      '<span class="c">' + items.length + " items</span></div>";
    col.innerHTML = head + '<div class="items"></div>';
    var box = col.querySelector(".items");
    var sorted = items.slice().sort(sortNewestFirst);
    var visible = sorted.slice(0, 5);
    var rest = sorted.slice(5);
    visible.forEach(function (it) { box.insertAdjacentHTML("beforeend", itemHTML(it)); });
    rest.forEach(function (it) { box.insertAdjacentHTML("beforeend", itemHTML(it).replace('class="item"', 'class="item hidden"')); });
    if (rest.length > 0) {
      var more = document.createElement("button");
      more.type = "button";
      more.className = "more";
      more.setAttribute("aria-expanded", "false");
      more.textContent = "+ See " + rest.length + " more";
      more.addEventListener("click", function () {
        var open = more.getAttribute("aria-expanded") === "true";
        box.querySelectorAll(".item.hidden").forEach(function (el) {
          el.style.display = open ? "none" : "flex";
        });
        more.setAttribute("aria-expanded", open ? "false" : "true");
        more.textContent = open ? "+ See " + rest.length + " more" : "Show less";
      });
      col.appendChild(more);
    }
    return col;
  }

  function load() {
    var feed = document.getElementById("feed");
    if (!feed) return;
    var only = document.body.getAttribute("data-bucket");
    var keys = Object.keys(DIM);
    if (only && DIM[only]) { keys = [only]; feed.classList.add("single"); }
    fetch("data/items.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (data) {
        var total = 0;
        keys.forEach(function (key) {
          var items = (data.buckets && data.buckets[key] && data.buckets[key].items) || [];
          total += items.length;
          feed.appendChild(buildColumn(key, items));
          var cnt = document.getElementById("c-" + key);
          if (cnt) cnt.textContent = items.length + " tracked";
        });
        ["t-total", "t-total2", "s-total"].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.textContent = String(total);
        });
        var up = document.getElementById("t-updated");
        if (up && data.updated) up.textContent = "Updated " + data.updated;
        var mini = document.getElementById("heroMini");
        if (mini && data.buckets) {
          var order = ["jobs", "access", "infra"];
          var rows = "";
          order.forEach(function (key) {
            var items = (data.buckets[key] && data.buckets[key].items) || [];
            var latest = items.slice().sort(sortNewestFirst)[0];
            var hue = DIM[key].hue;
            rows += '<div class="mirow"><span class="ic ' + key + '">' + key[0].toUpperCase() + "</span>" +
              '<div><div class="nm">' + DIM[key].label + "</div>" +
              '<div class="tx">' + (latest ? esc(latest.t).slice(0, 46) + "…" : "no entries yet") + "</div></div>" +
              '<span class="n">' + items.length + "</span></div>";
          });
          mini.innerHTML = rows;
        }
      })
      .catch(function (err) {
        feed.innerHTML = '<p style="grid-column:1/-1;color:#5a6472;font-size:14px">Live feed unavailable (' +
          esc(err.message) + '). Raw data: <a href="data/items.json">data/items.json</a>.</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
