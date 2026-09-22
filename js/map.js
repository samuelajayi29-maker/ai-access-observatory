// ---- map: layer switching and the country panel (no-op without a map)
(function () {
  var host = document.querySelector('[data-map]');
  var dataEl = document.getElementById('map-data');
  if (!host || !dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var panel = host.querySelector('[data-panel]');
  var legend = host.querySelector('[data-legend]');
  var current = 'jobs';
  // internal schema names, said the way a reader would say them
  var EVIDENCE_LABEL = { official: 'OFFICIAL', primary_filing: 'PRIMARY FILING',
                         company_filing: 'COMPANY', industry_body: 'INDUSTRY BODY',
                         academic: 'ACADEMIC', trade_reporting: 'REPORTED',
                         tested: 'TESTED', derived: 'DERIVED', unclear: 'UNCLEAR' };
  var TEMPORAL_LABEL = { measured: 'MEASURED', modelled: 'MODELLED', announced: 'ANNOUNCED',
                         forecast: 'FORECAST', projection: 'PROJECTION', proposal: 'PROPOSAL' };
  var selected = null;

  function band(k, v) {
    var b = D.breaks[k] || [];
    if (v === null || v === undefined) return 'none';
    for (var i = 0; i < b.length; i++) { if (v <= b[i]) return String(i + 1); }
    return '5';
  }
  function paint() {
    var L = D.layers[current] || {};
    host.querySelectorAll('[data-iso]').forEach(function (el) {
      var v = L[el.getAttribute('data-iso')];
      var cls = (v === undefined) ? 'none' : band(current, v);
      if (el.classList.contains('map__c')) {
        el.setAttribute('class', 'map__c map__c--' + cls);
      } else {
        el.setAttribute('class', 'map__mark map__mark--' + cls);
      }
    });
    if (legend) legend.innerHTML = D.legends[current] || '';
    host.querySelectorAll('.map__tab').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-layer') === current);
    });
  }
  function fmt(k, v) {
    if (v === null || v === undefined) return null;
    var unit = (D.meta[k] || {}).unit || '';
    var big = Math.abs(v) >= 100;
    return (big ? Math.round(v).toLocaleString() : v.toFixed(1)) + ' ' + unit;
  }
  function show(iso) {
    selected = iso;
    var name = iso;
    var el = host.querySelector('[data-iso="' + iso + '"]');
    if (el) {
      var a = el.getAttribute('aria-label') || '';
      name = a.split(':')[0];
    }
    var rows = '';
    ['jobs', 'access', 'infra'].forEach(function (k) {
      var m = D.meta[k] || {};
      var v = (D.layers[k] || {})[iso];
      var f = fmt(k, v);
      rows += '<div class="map__row"><h4>' + m.label + '</h4>';
      if (f === null) {
        rows += '<p class="map__none">Data unavailable</p>';
      } else {
        var ev = EVIDENCE_LABEL[m.evidence_status] || (m.evidence_status || '').toUpperCase();
        var tp = TEMPORAL_LABEL[m.temporal_status] || (m.temporal_status || '').toUpperCase();
        var st = (ev && tp && ev !== tp) ? (ev + ' \u00b7 ' + tp) : (tp || ev);
        var tier = m.tier_label ? (m.tier_label + ' \u00b7 Tier ' + m.tier) : '';
        rows += '<p class="map__value">' + f + '</p>' +
                '<p class="map__prov"><span class="map__status">' + st + '</span> ' + tier + '</p>' +
                '<p class="map__src">' + m.source + '</p>';
      }
      rows += '</div>';
    });
    var link = (D.pages && D.pages[iso])
      ? '<p class="map__link"><a href="' + D.pages[iso] + '">Open the country profile \u2192</a></p>'
      : '';
    panel.innerHTML = '<h3 class="map__panel-title">' + name + '</h3>' + rows + link +
      '<p class="map__prov">Last updated 22 September 2026</p>';
  }
  host.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-iso],.map__tab') : null;
    if (!t) return;
    if (t.classList.contains('map__tab')) {
      current = t.getAttribute('data-layer');
      paint();
      if (selected) show(selected);
    } else {
      show(t.getAttribute('data-iso'));
    }
  });
  host.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target;
    if (t && t.hasAttribute && t.hasAttribute('data-iso')) {
      e.preventDefault();
      show(t.getAttribute('data-iso'));
    }
  });
  paint();
  window.__mapReady = true;
})();
