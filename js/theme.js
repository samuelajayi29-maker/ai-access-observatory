(function () {
  'use strict';
  var key = 'observatory-appearance';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var choice = 'system';
  function valid(value) { return ['light', 'dark', 'system'].indexOf(value) >= 0; }
  try { var saved = localStorage.getItem(key); if (valid(saved)) choice = saved; } catch (_) {}
  function apply() {
    if (choice === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', choice);
    var select = document.getElementById('site-appearance');
    if (select) select.value = choice;
    document.dispatchEvent(new Event('observatory-theme-change'));
  }
  // Loaded in the head so a saved choice applies before the page is painted.
  apply();
  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('.evidence-nav-bottom') || document.querySelector('#primary-nav') || document.querySelector('.masthead__inner');
    if (!header) return;
    var label = document.createElement('label'); label.className = 'theme-picker';
    label.htmlFor = 'site-appearance'; label.appendChild(document.createTextNode('Appearance'));
    var select = document.createElement('select'); select.id = 'site-appearance';
    [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].forEach(function (entry) {
      var option = document.createElement('option'); option.value = entry[0]; option.textContent = entry[1]; select.appendChild(option);
    });
    select.value = choice;
    select.addEventListener('change', function () {
      choice = select.value;
      try { localStorage.setItem(key, choice); } catch (_) {}
      apply();
    });
    label.appendChild(select); header.appendChild(label);
  });
  function systemChanged() { if (choice === 'system') apply(); }
  if (media.addEventListener) media.addEventListener('change', systemChanged);
  else if (media.addListener) media.addListener(systemChanged);
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) {
      choice = valid(event.newValue) ? event.newValue : 'system'; apply();
    }
  });
})();
