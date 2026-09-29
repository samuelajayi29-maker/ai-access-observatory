// Shared, progressive enhancements for long pages and registers.
(function () {
  'use strict';

  function normalize(value) {
    var text = String(value == null ? '' : value).toLocaleLowerCase();
    if (text.normalize) text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return text.trim();
  }

  function slug(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
  }

  function addSectionNavigation() {
    var page = document.body.getAttribute('data-page');
    if (!/^(access|jobs|infrastructure)\.html$/.test(page || '')) return;
    var column = document.querySelector('.layout > div');
    if (!column) return;
    if (column.querySelector('[data-guided-explorer]')) return;
    var headings = Array.prototype.slice.call(column.querySelectorAll('h2.sec'));
    if (headings.length < 3) return;

    var used = {};
    var list = document.createElement('ul');
    headings.forEach(function (heading) {
      var base = heading.id || slug(heading.textContent);
      var id = base;
      var suffix = 2;
      while (used[id] || (document.getElementById(id) && document.getElementById(id) !== heading)) {
        id = base + '-' + suffix;
        suffix += 1;
      }
      used[id] = true;
      heading.id = id;
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + id;
      link.textContent = heading.textContent.trim();
      item.appendChild(link);
      list.appendChild(item);
    });

    var nav = document.createElement('nav');
    nav.className = 'page-jump';
    nav.setAttribute('aria-label', 'On this page');
    var title = document.createElement('b');
    title.textContent = 'On this page';
    nav.appendChild(title);
    nav.appendChild(list);
    var first = column.firstElementChild;
    if (first && first.classList.contains('readout')) first.insertAdjacentElement('afterend', nav);
    else column.insertAdjacentElement('afterbegin', nav);
  }

  function addCountryFilter() {
    var input = document.querySelector('[data-country-filter]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-country-card]'));
    if (!input || !cards.length) return;
    var count = document.querySelector('[data-country-filter-count]');
    var empty = document.querySelector('[data-country-empty]');
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    if (initial) input.value = initial;

    function update() {
      var query = normalize(input.value);
      var visible = 0;
      cards.forEach(function (card) {
        var match = !query || normalize(card.textContent).indexOf(query) !== -1;
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (count) count.textContent = query ? ('Showing ' + visible + ' of ' + cards.length + ' profiles')
        : (cards.length + ' profiles');
      if (empty) empty.hidden = visible !== 0;
    }
    input.addEventListener('input', update);
    update();
  }

  function addTableFilters() {
    var tables = Array.prototype.slice.call(document.querySelectorAll('table.register'));
    tables.forEach(function (table, index) {
      if (table.hasAttribute('data-cb-table')) return;
      Array.prototype.slice.call(table.querySelectorAll('thead th')).forEach(function (heading) {
        if (!heading.hasAttribute('scope')) heading.setAttribute('scope', 'col');
      });
      var wrapper = table.closest('.tablewrap');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'tablewrap';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
      if (wrapper.scrollWidth > wrapper.clientWidth) {
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', 'Scrollable data table');
      }
      var body = table.tBodies[0];
      if (!body) return;
      var rows = Array.prototype.slice.call(body.rows);
      if (rows.length < 12) return;

      var tools = document.createElement('div');
      tools.className = 'table-tools';
      var label = document.createElement('label');
      var input = document.createElement('input');
      var id = 'table-filter-' + (index + 1);
      label.htmlFor = id;
      label.textContent = 'Search these rows';
      input.id = id;
      input.type = 'search';
      input.autocomplete = 'off';
      input.setAttribute('aria-controls', table.id || id + '-table');
      if (!table.id) table.id = id + '-table';
      tools.appendChild(label);
      tools.appendChild(input);
      var count = document.createElement('p');
      count.className = 'table-tools__count';
      count.setAttribute('aria-live', 'polite');
      tools.appendChild(count);
      var empty = document.createElement('p');
      empty.className = 'table-tools__empty';
      empty.textContent = 'No rows match that search.';
      empty.hidden = true;
      tools.appendChild(empty);

      wrapper.parentNode.insertBefore(tools, wrapper);
      function update() {
        var query = normalize(input.value);
        var visible = 0;
        rows.forEach(function (row) {
          var match = !query || normalize(row.textContent).indexOf(query) !== -1;
          row.hidden = !match;
          if (match) visible += 1;
        });
        count.textContent = 'Showing ' + visible + ' of ' + rows.length + ' rows';
        empty.hidden = visible !== 0;
      }
      input.addEventListener('input', update);
      update();
    });
  }

  function addMapCountryFilter() {
    var input = document.querySelector('[data-map-country-filter]');
    var list = document.querySelector('.map__country-list');
    if (!input || !list) return;
    var items = Array.prototype.slice.call(list.children);
    var count = document.querySelector('[data-map-country-count]');
    function update() {
      var query = normalize(input.value);
      var visible = 0;
      items.forEach(function (item) {
        var match = !query || normalize(item.textContent).indexOf(query) !== -1;
        item.hidden = !match;
        if (match) visible += 1;
      });
      if (count) count.textContent = visible + (visible === 1 ? ' country' : ' countries');
    }
    input.addEventListener('input', update);
  }

  function readExplorerData(id) {
    var node = document.getElementById(id);
    if (!node) return null;
    try { return JSON.parse(node.textContent || '{}'); }
    catch (error) { return null; }
  }

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function addText(parent, tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value == null ? '' : String(value);
    parent.appendChild(node);
    return node;
  }

  function addSourceLink(parent, url, label) {
    if (!url || !/^https?:\/\//i.test(String(url))) return;
    var link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = label || 'Source';
    parent.appendChild(link);
  }

  function formatUSD(value, decimals) {
    if (value == null || !isFinite(Number(value))) return 'No information';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: decimals == null ? 2 : decimals
    }).format(Number(value));
  }

  function displayLabel(value) {
    return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function uniqueValues(rows, key) {
    var values = {};
    rows.forEach(function (row) { if (row[key]) values[row[key]] = true; });
    return Object.keys(values);
  }

  function wireTabs(root, selector, onChange) {
    var buttons = Array.prototype.slice.call(root.querySelectorAll(selector));
    if (!buttons.length) return;
    function activate(button, focus) {
      buttons.forEach(function (item) {
        var active = item === button;
        item.setAttribute('aria-selected', active ? 'true' : 'false');
        item.tabIndex = active ? 0 : -1;
      });
      if (focus) button.focus();
      onChange(button);
    }
    buttons.forEach(function (button, index) {
      button.addEventListener('click', function () { activate(button, false); });
      button.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = buttons.length - 1;
        else return;
        event.preventDefault();
        activate(buttons[next], true);
      });
    });
  }

  function initAccessExplorer() {
    var root = document.querySelector('[data-access-explorer]');
    var data = readExplorerData('access-explorer-data');
    if (!root || !data) return;
    var countrySelect = root.querySelector('[data-access-country]');
    var modelSelect = root.querySelector('[data-access-model]');
    var byIso = {};
    data.countries.forEach(function (country) { byIso[country.iso3] = country; });

    function render() {
      var country = countrySelect.value;
      var place = byIso[country] || { name: country };
      var model = data.models.filter(function (item) { return item.model === modelSelect.value; })[0];
      var workload = root.querySelector('[data-access-workload]');
      var definition = root.querySelector('[data-access-workload-definition]');
      var affordability = root.querySelector('[data-access-affordability]');
      var workloadCoverage = root.querySelector('[data-access-workload-coverage]');
      var workloadSource = root.querySelector('[data-access-workload-source]');
      var subscriptionList = root.querySelector('[data-access-subscriptions]');
      var subscriptionCoverage = root.querySelector('[data-access-subscription-coverage]');
      var availability = root.querySelector('[data-access-availability]');
      var availabilityCoverage = root.querySelector('[data-access-availability-coverage]');
      var payment = root.querySelector('[data-access-payment-result]');
      var paymentCoverage = root.querySelector('[data-access-payment-coverage]');
      if (!model) return;

      workload.textContent = formatUSD(model.workload, 2);
      definition.textContent = data.workloadDefinition + ' · API list price for ' + model.model + ' (' + model.lab + ').';
      var affordabilityRow = data.affordability.filter(function (row) {
        return row.model === model.model && row.country === country;
      })[0];
      var modelCountryCount = data.affordability.filter(function (row) { return row.model === model.model; }).length;
      affordability.textContent = affordabilityRow
        ? 'In ' + place.name + ', this workload equals ' + Number(affordabilityRow.share).toFixed(2) + '% of monthly GNI per capita (a national average).'
        : 'No information for this model and country pairing.';
      workloadCoverage.textContent = 'API prices are held for ' + data.models.length + ' models; this model’s GNI-based comparison covers ' +
        modelCountryCount + ' of ' + data.countries.length + ' countries.';
      clearNode(workloadSource);
      addText(workloadSource, 'span', '', displayLabel(model.status) + ' · ' + model.date + ' · ');
      addSourceLink(workloadSource, model.url, model.source || 'Model price source');

      var subscriptionRows = data.subscriptions.filter(function (row) {
        return row.provider === model.provider && row.country === country;
      }).sort(function (a, b) {
        var ap = a.price == null ? Number.MAX_VALUE : a.price;
        var bp = b.price == null ? Number.MAX_VALUE : b.price;
        return ap - bp || String(a.tier).localeCompare(String(b.tier));
      });
      clearNode(subscriptionList);
      if (!subscriptionRows.length) {
        addText(subscriptionList, 'li', 'explorer-no-data', 'No information for this provider-country pair in the subscription register.');
      } else {
        subscriptionRows.forEach(function (row) {
          var item = document.createElement('li');
          var heading = addText(item, 'strong', '', row.product + ' · ' + row.tier);
          var detail = document.createElement('span');
          detail.className = 'explorer-list__detail';
          var monthly = row.price == null ? 'Monthly price: No information' : formatUSD(row.price, 2) + ' / month';
          var share = row.share == null ? '' : ' · ' + Number(row.share).toFixed(2) + '% of monthly GNI per capita';
          detail.textContent = monthly + share;
          item.appendChild(detail);
          var local = row.localPrice === 'yes' ? 'Local price listed' : row.localPrice === 'no' ? 'No local price listed' : 'Local price information unclear';
          addText(item, 'span', 'explorer-list__detail', local + (row.localAmount ? ': ' + row.localCurrency + ' ' + row.localAmount : ''));
          var source = document.createElement('span');
          source.className = 'explorer-source';
          addText(source, 'span', '', row.date ? 'Recorded ' + row.date + ' · ' : '');
          addSourceLink(source, row.source, 'Plan source');
          item.appendChild(source);
          subscriptionList.appendChild(item);
        });
      }
      var providerSubs = data.subscriptions.filter(function (row) { return row.provider === model.provider; });
      subscriptionCoverage.textContent = 'Published plan rows for ' + uniqueValues(providerSubs, 'country').length +
        ' of ' + data.countries.length + ' countries; tier and country coverage can differ.';

      var officialRows = data.official.filter(function (row) {
        return row.provider === model.provider && row.country === country;
      });
      var providerOfficial = data.official.filter(function (row) { return row.provider === model.provider; });
      clearNode(availability);
      if (officialRows.length) {
        var officialList = document.createElement('ul');
        officialRows.forEach(function (row) {
          var item = document.createElement('li');
          addText(item, 'strong', '', row.product + ': ' + (row.status === 'listed_supported' ? 'listed as supported' : displayLabel(row.status)));
          var source = document.createElement('span');
          source.className = 'explorer-source';
          addText(source, 'span', '', row.date ? 'Checked ' + row.date + ' · ' : '');
          addSourceLink(source, row.source, 'Official list');
          item.appendChild(source);
          officialList.appendChild(item);
        });
        availability.appendChild(officialList);
      } else {
        addText(availability, 'p', 'explorer-no-data', providerOfficial.length
          ? 'This country is not shown on the provider’s published location list in this register. The absence of a listing is not an independent service check.'
          : 'No information: this provider has no official location list in the current register.');
      }
      availabilityCoverage.textContent = providerOfficial.length
        ? uniqueValues(providerOfficial, 'country').length + ' African countries appear across this provider’s official product lists.'
        : 'No country coverage is available for this provider in the official-list register.';

      var paymentRows = data.payments.filter(function (row) {
        return row.provider === model.provider && row.country === country;
      });
      var providerPayments = data.payments.filter(function (row) { return row.provider === model.provider; });
      clearNode(payment);
      if (!paymentRows.length) {
        addText(payment, 'p', 'explorer-no-data', 'No information for this provider-country pair in the signup and payment register.');
      } else {
        paymentRows.forEach(function (row) {
          var facts = document.createElement('dl');
          facts.className = 'evidence-facts';
          [
            ['Signup recorded', row.signup], ['Locally issued cards accepted', row.cards],
            ['Local payment rails accepted', row.rails], ['Foreign card required', row.foreignCard]
          ].forEach(function (fact) {
            addText(facts, 'dt', '', fact[0]);
            addText(facts, 'dd', '', fact[1] ? displayLabel(fact[1]) : 'No information');
          });
          payment.appendChild(facts);
          var meta = document.createElement('p');
          meta.className = 'explorer-source';
          addText(meta, 'span', '', displayLabel(row.evidence) + ' · ' + displayLabel(row.status) +
            (row.date ? ' · recorded ' + row.date + ' · ' : ' · '));
          addSourceLink(meta, row.source, 'Payment evidence source');
          payment.appendChild(meta);
        });
      }
      paymentCoverage.textContent = uniqueValues(providerPayments, 'country').length +
        ' of ' + data.countries.length + ' countries have provider-specific payment records.';
    }

    countrySelect.addEventListener('change', render);
    modelSelect.addEventListener('change', render);
    render();
  }

  function initJobsExplorer() {
    var root = document.querySelector('[data-jobs-explorer]');
    var data = readExplorerData('jobs-explorer-data');
    if (!root || !data) return;
    var search = root.querySelector('[data-jobs-search]');
    var ranking = root.querySelector('[data-jobs-ranking]');
    var missingList = root.querySelector('[data-jobs-no-info]');
    var missingDetails = root.querySelector('[data-jobs-missing-details]');
    var currentMetric = 'tasks';
    var selectedIso = (data.metrics.tasks.rows[0] || {}).iso || '';

    function renderDetail(metric, row, country) {
      var place = data.countries.filter(function (item) { return item.iso3 === country; })[0];
      var heading = root.querySelector('[data-jobs-country]');
      var value = root.querySelector('[data-jobs-value]');
      var rank = root.querySelector('[data-jobs-rank]');
      var secondary = root.querySelector('[data-jobs-secondary]');
      var compare = root.querySelector('[data-jobs-compare]');
      var metricLabel = root.querySelector('[data-jobs-metric-label]');
      var countryLabel = root.querySelector('[data-jobs-country-label]');
      var countryNumber = root.querySelector('[data-jobs-country-number]');
      var averageNumber = root.querySelector('[data-jobs-average-number]');
      var countryBar = root.querySelector('[data-jobs-country-bar]');
      var averageBar = root.querySelector('[data-jobs-average-bar]');
      var definition = root.querySelector('[data-jobs-definition]');
      var source = root.querySelector('[data-jobs-source]');
      heading.textContent = place ? place.name : country;
      metricLabel.textContent = metric.label;
      definition.textContent = metric.definition;
      clearNode(source);
      if (!row) {
        value.textContent = 'No information';
        rank.textContent = 'This country is not in this measure’s source sample.';
        secondary.hidden = true;
        compare.hidden = true;
        countryLabel.textContent = place ? place.name : country;
        countryNumber.textContent = 'No information';
        averageNumber.textContent = metric.averageLabel;
        countryBar.style.width = '0%';
        averageBar.style.width = '0%';
        addText(source, 'span', '', 'Coverage for this measure: ' + metric.coverage + ' of ' + data.countries.length + ' countries. No value is borrowed from the other measure.');
        return;
      }
      var rows = metric.rows;
      var rowIndex = rows.indexOf(row);
      var text = metric.unit === '%' ? Number(row.value).toFixed(1) + '%' : Number(row.value).toFixed(3);
      value.textContent = text;
      rank.textContent = 'Rank ' + (rowIndex + 1) + ' of ' + rows.length + ' measured countries.';
      if (row.secondary != null && metric.unit === '%') {
        secondary.textContent = 'Tasks at the highest exposure level: ' + Number(row.secondary).toFixed(1) + '%.';
        secondary.hidden = false;
      } else secondary.hidden = true;
      compare.hidden = false;
      countryLabel.textContent = place ? place.name : row.name;
      countryNumber.textContent = text;
      averageNumber.textContent = metric.averageLabel;
      var scale = Math.max.apply(null, rows.map(function (item) { return Number(item.value); })) || 1;
      countryBar.style.width = Math.max(0, Math.min(100, Number(row.value) / scale * 100)) + '%';
      averageBar.style.width = Math.max(0, Math.min(100, Number(metric.average) / scale * 100)) + '%';
      compare.setAttribute('aria-label', (place ? place.name : row.name) + ': ' + text + '; average of measured countries: ' + metric.averageLabel + '.');
      addText(source, 'span', '', (row.date ? 'Source captured ' + row.date + ' · ' : '') + '');
      addSourceLink(source, row.source, 'Research source');
    }

    function render() {
      var metric = data.metrics[currentMetric];
      var query = normalize(search.value);
      var measuredIsos = {};
      var matches = 0;
      var maxValue = Math.max.apply(null, metric.rows.map(function (row) { return Number(row.value); })) || 1;
      clearNode(ranking);
      metric.rows.forEach(function (row, index) {
        measuredIsos[row.iso] = true;
        if (query && normalize(row.name + ' ' + row.iso).indexOf(query) === -1) return;
        matches += 1;
        var item = document.createElement('li');
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'country-ranking__button';
        button.setAttribute('aria-pressed', row.iso === selectedIso ? 'true' : 'false');
        button.setAttribute('aria-label', 'Rank ' + (index + 1) + ', ' + row.name + ', ' +
          (metric.unit === '%' ? Number(row.value).toFixed(1) + ' percent' : Number(row.value).toFixed(3)));
        addText(button, 'span', 'country-ranking__rank', String(index + 1));
        addText(button, 'span', 'country-ranking__name', row.name);
        var track = document.createElement('span');
        track.className = 'country-ranking__track';
        track.setAttribute('aria-hidden', 'true');
        var bar = document.createElement('i');
        bar.style.width = Math.max(0, Math.min(100, Number(row.value) / maxValue * 100)) + '%';
        track.appendChild(bar);
        button.appendChild(track);
        addText(button, 'span', 'country-ranking__value', metric.unit === '%' ? Number(row.value).toFixed(1) + '%' : Number(row.value).toFixed(3));
        button.addEventListener('click', function () { selectedIso = row.iso; render(); });
        item.appendChild(button);
        ranking.appendChild(item);
      });
      var missing = data.countries.filter(function (country) {
        return !measuredIsos[country.iso3] && (!query || normalize(country.name + ' ' + country.iso3).indexOf(query) !== -1);
      });
      clearNode(missingList);
      missing.forEach(function (country) {
        var item = document.createElement('li');
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'country-ranking__button country-ranking__button--missing';
        button.setAttribute('aria-pressed', country.iso3 === selectedIso ? 'true' : 'false');
        button.setAttribute('aria-label', country.name + ', no information for ' + metric.label);
        addText(button, 'span', 'country-ranking__rank', '—');
        addText(button, 'span', 'country-ranking__name', country.name);
        addText(button, 'span', 'country-ranking__value', 'No information');
        button.addEventListener('click', function () { selectedIso = country.iso3; render(); });
        item.appendChild(button);
        missingList.appendChild(item);
      });
      root.querySelector('[data-jobs-coverage]').textContent = metric.coverage + ' of ' + data.countries.length + ' countries measured; missing countries are listed separately.';
      root.querySelector('[data-jobs-missing-count]').textContent = '(' + (data.countries.length - metric.coverage) + ')';
      root.querySelector('[data-jobs-no-results]').hidden = matches + missing.length !== 0;
      if (query) missingDetails.open = missing.length > 0;
      var selectedRow = metric.rows.filter(function (row) { return row.iso === selectedIso; })[0];
      root.querySelectorAll('[data-jobs-metric]').forEach(function (button) {
        button.setAttribute('aria-selected', button.getAttribute('data-jobs-metric') === currentMetric ? 'true' : 'false');
        button.tabIndex = button.getAttribute('data-jobs-metric') === currentMetric ? 0 : -1;
      });
      var panel = root.querySelector('#jobs-explorer-panel');
      panel.setAttribute('aria-labelledby', currentMetric === 'tasks' ? 'jobs-tab-tasks' : 'jobs-tab-weighted');
      renderDetail(metric, selectedRow, selectedIso);
    }

    wireTabs(root, '[data-jobs-metric]', function (button) {
      currentMetric = button.getAttribute('data-jobs-metric');
      render();
    });
    search.addEventListener('input', render);
    render();
  }

  function initInfrastructureExplorer() {
    var root = document.querySelector('[data-infra-explorer]');
    var data = readExplorerData('infra-explorer-data');
    if (!root || !data) return;
    var countrySelect = root.querySelector('[data-infra-country]');
    var statusSelect = root.querySelector('[data-infra-status]');
    var activeView = 'capacity';
    var countryNames = {};
    data.countries.forEach(function (country) { countryNames[country.iso3] = country.name; });

    function matchingProjects() {
      return data.projects.filter(function (project) {
        var countryMatch = countrySelect.value === 'all' || project.countries.indexOf(countrySelect.value) !== -1;
        var statusMatch = statusSelect.value === 'all' || project.status === statusSelect.value;
        return countryMatch && statusMatch;
      });
    }

    function projectItem(project, includeDate) {
      var item = document.createElement('li');
      item.className = 'project-row';
      var main = document.createElement('span');
      main.className = 'project-row__main';
      var title = document.createElement('strong');
      title.textContent = project.name;
      main.appendChild(title);
      addText(main, 'span', 'project-meta', project.country + ' · ' + displayLabel(project.status));
      if (project.sponsors) addText(main, 'span', 'project-meta', project.sponsors);
      if (project.detail || project.note) addText(main, 'span', 'project-meta', project.detail || project.note);
      if (includeDate && project.announced) {
        var date = document.createElement('time');
        date.dateTime = project.announced;
        date.textContent = 'Announced ' + project.announced;
        date.className = 'project-meta';
        main.appendChild(date);
      }
      var source = document.createElement('span');
      source.className = 'explorer-source';
      addSourceLink(source, project.url, project.source || 'Source');
      main.appendChild(source);
      item.appendChild(main);
      var capacity = project.capacity == null ? 'No published capacity' :
        Number(project.capacity).toLocaleString('en-US') + ' MW' + (project.singleCountry ? '' : ' · project-wide, not allocated');
      addText(item, 'span', 'project-value', capacity);
      return item;
    }

    function renderCapacity() {
      var target = root.querySelector('[data-infra-capacity-status]');
      clearNode(target);
      var byStatus = {};
      data.projects.forEach(function (project) {
        if (!byStatus[project.status]) byStatus[project.status] = { count: 0, unknown: 0, mw: 0 };
        byStatus[project.status].count += 1;
        if (project.capacity == null) byStatus[project.status].unknown += 1;
        else byStatus[project.status].mw += Number(project.capacity);
      });
      var groups = Object.keys(byStatus).map(function (status) { return { status: status, data: byStatus[status] }; });
      var maximum = Math.max.apply(null, groups.map(function (group) { return group.data.mw; })) || 1;
      groups.sort(function (a, b) { return b.data.mw - a.data.mw || a.status.localeCompare(b.status); });
      groups.forEach(function (group) {
        var row = document.createElement('div');
        row.className = 'capacity-status-row';
        var heading = document.createElement('div');
        heading.className = 'capacity-status-row__heading';
        addText(heading, 'strong', '', displayLabel(group.status));
        addText(heading, 'span', '', group.data.count + ' project ' + (group.data.count === 1 ? 'row' : 'rows'));
        addText(heading, 'span', 'capacity-status-row__value', group.data.count > group.data.unknown
          ? group.data.mw.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' MW named'
          : 'No information for capacity');
        row.appendChild(heading);
        var track = document.createElement('span');
        track.className = 'capacity-status-row__track';
        track.setAttribute('aria-hidden', 'true');
        var bar = document.createElement('i');
        bar.style.width = (group.data.mw / maximum * 100) + '%';
        track.appendChild(bar);
        row.appendChild(track);
        if (group.data.unknown) addText(row, 'span', 'project-meta', group.data.unknown + ' rows with no published capacity');
        target.appendChild(row);
      });
    }

    function renderCountry() {
      var target = root.querySelector('[data-infra-country-view]');
      clearNode(target);
      var selected = countrySelect.value;
      var projects = matchingProjects();
      if (selected === 'all') {
        var groups = {};
        projects.forEach(function (project) {
          if (!project.singleCountry) return;
          if (!groups[project.singleCountry]) groups[project.singleCountry] = { count: 0, unknown: 0, mw: 0 };
          groups[project.singleCountry].count += 1;
          if (project.capacity == null) groups[project.singleCountry].unknown += 1;
          else groups[project.singleCountry].mw += Number(project.capacity);
        });
        var keys = Object.keys(groups).sort(function (a, b) {
          return groups[b].mw - groups[a].mw || countryNames[a].localeCompare(countryNames[b]);
        });
        addText(target, 'p', 'coverage-note', keys.length + ' of ' + data.countries.length + ' countries have single-country project rows under the selected status filter. Countries without a row are not shown as having zero capacity.');
        var list = document.createElement('ul');
        list.className = 'country-capacity-list';
        keys.forEach(function (iso) {
          var group = groups[iso];
          var item = document.createElement('li');
          addText(item, 'strong', '', countryNames[iso] || iso);
          addText(item, 'span', '', group.count + ' project ' + (group.count === 1 ? 'row' : 'rows'));
          addText(item, 'span', 'country-capacity-list__value', group.count > group.unknown
            ? group.mw.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' MW named'
            : 'No published capacity');
          if (group.unknown) addText(item, 'span', 'project-meta', group.unknown + ' rows without a published MW figure');
          list.appendChild(item);
        });
        target.appendChild(list);
        var regional = projects.filter(function (project) { return !project.singleCountry; });
        if (regional.length) {
          addText(target, 'h4', '', 'Cross-border and pan-African rows');
          addText(target, 'p', 'explorer-footnote', 'These rows retain their published geographic scope; project-wide capacity is not assigned to country totals.');
          var regionalList = document.createElement('ul');
          regionalList.className = 'project-list';
          regional.forEach(function (project) { regionalList.appendChild(projectItem(project, false)); });
          target.appendChild(regionalList);
        }
        return;
      }
      var exact = projects.filter(function (project) { return project.singleCountry === selected; });
      var shared = projects.filter(function (project) { return !project.singleCountry && project.countries.indexOf(selected) !== -1; });
      var name = countryNames[selected] || selected;
      var mw = exact.reduce(function (sum, project) { return sum + (project.capacity == null ? 0 : Number(project.capacity)); }, 0);
      var noCapacity = exact.filter(function (project) { return project.capacity == null; }).length;
      if (!exact.length) addText(target, 'p', 'explorer-no-data', 'No single-country project rows match the selected filters for ' + name + '. This does not mean the country has no data-centre capacity.');
      else addText(target, 'p', 'country-view-summary', exact.length + ' project ' + (exact.length === 1 ? 'row' : 'rows') + ' assigned to ' + name + '; ' +
        (mw ? mw.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' MW named' : 'no published capacity figure') +
        (noCapacity ? '; ' + noCapacity + ' row' + (noCapacity === 1 ? '' : 's') + ' without a published capacity.' : '.'));
      exact.forEach(function (project) { target.appendChild(projectItem(project, false)); });
      if (shared.length) {
        addText(target, 'h4', '', 'Cross-border projects mentioning ' + name);
        addText(target, 'p', 'explorer-footnote', 'Their published capacity is project-wide and is not assigned to this country.');
        var sharedList = document.createElement('ul');
        sharedList.className = 'project-list';
        shared.forEach(function (project) { sharedList.appendChild(projectItem(project, false)); });
        target.appendChild(sharedList);
      }
    }

    function renderProjects() {
      var target = root.querySelector('[data-infra-projects]');
      var projects = matchingProjects().sort(function (a, b) { return b.announced.localeCompare(a.announced); });
      clearNode(target);
      root.querySelector('[data-infra-project-count]').textContent = 'Showing ' + projects.length + ' of ' + data.projects.length + ' project rows. Missing capacity stays blank.';
      if (!projects.length) addText(target, 'li', 'explorer-no-data', 'No project rows match these filters.');
      else projects.forEach(function (project) { target.appendChild(projectItem(project, true)); });
    }

    function renderTimeline() {
      var target = root.querySelector('[data-infra-timeline]');
      var projects = matchingProjects().sort(function (a, b) { return b.announced.localeCompare(a.announced); });
      clearNode(target);
      if (!projects.length) addText(target, 'li', 'explorer-no-data', 'No project rows match these filters.');
      else projects.forEach(function (project) { target.appendChild(projectItem(project, true)); });
    }

    function renderInvestments() {
      var target = root.querySelector('[data-infra-investments]');
      var projects = matchingProjects().filter(function (project) {
        return project.capexUsd != null || project.capexLocal != null || project.committed != null || project.target != null;
      }).sort(function (a, b) { return b.announced.localeCompare(a.announced); });
      clearNode(target);
      if (!projects.length) {
        addText(target, 'li', 'explorer-no-data', 'No investment-amount rows match these filters.');
        return;
      }
      projects.forEach(function (project) {
        var item = document.createElement('li');
        item.className = 'investment-row';
        addText(item, 'strong', '', project.name);
        addText(item, 'span', 'project-meta', project.country + ' · ' + displayLabel(project.status));
        var amounts = document.createElement('ul');
        amounts.className = 'investment-row__amounts';
        if (project.capexUsd != null) addText(amounts, 'li', '', 'Reported facility CAPEX: ' + formatUSD(project.capexUsd, 0));
        if (project.capexLocal != null) addText(amounts, 'li', '', 'Local-currency CAPEX as recorded: ' +
          (project.localCurrency ? project.localCurrency + ' ' : '') + Number(project.capexLocal).toLocaleString('en-US'));
        if (project.committed != null) addText(amounts, 'li', '', 'Committed capital (lower bound): ' + formatUSD(project.committed, 0));
        if (project.target != null) addText(amounts, 'li', '', 'Investment target: ' + formatUSD(project.target, 0));
        item.appendChild(amounts);
        if (!project.singleCountry) addText(item, 'span', 'project-meta', 'Project-level amount; not assigned to individual countries.');
        var source = document.createElement('span');
        source.className = 'explorer-source';
        addSourceLink(source, project.url, project.source || 'Source');
        item.appendChild(source);
        target.appendChild(item);
      });
    }

    function render() {
      var panels = Array.prototype.slice.call(root.querySelectorAll('[data-infra-panel]'));
      panels.forEach(function (panel) { panel.hidden = panel.getAttribute('data-infra-panel') !== activeView; });
      root.querySelectorAll('[data-infra-view]').forEach(function (button) {
        var active = button.getAttribute('data-infra-view') === activeView;
        button.setAttribute('aria-selected', active ? 'true' : 'false');
        button.tabIndex = active ? 0 : -1;
      });
      var activeButton = root.querySelector('[data-infra-view="' + activeView + '"]');
      if (activeButton) root.querySelector('#infra-panel-' + activeView).setAttribute('aria-labelledby', activeButton.id);
      renderCapacity();
      renderCountry();
      renderProjects();
      renderTimeline();
      renderInvestments();
    }

    wireTabs(root, '[data-infra-view]', function (button) {
      activeView = button.getAttribute('data-infra-view');
      render();
    });
    countrySelect.addEventListener('change', render);
    statusSelect.addEventListener('change', render);
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    addSectionNavigation();
    addCountryFilter();
    addTableFilters();
    addMapCountryFilter();
    initAccessExplorer();
    initJobsExplorer();
    initInfrastructureExplorer();
  });
})();
