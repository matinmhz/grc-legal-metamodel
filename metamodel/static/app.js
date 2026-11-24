const $ = id => document.getElementById(id);
let mermaid;
let data;
let revision = 0;
let pageSize = Number($('page-size').value);
let pageOffset = 0;
const layerColors = {
  ASSESSMENT: {fill:'#eeeaff',stroke:'#7662c4',text:'#30275d'},
  CONDITION: {fill:'#e8f3ff',stroke:'#5387bd',text:'#203c5a'},
  CONSEQUENCE: {fill:'#fff0df',stroke:'#c77b36',text:'#593512'},
  CONTROL: {fill:'#e5f5ec',stroke:'#4b9870',text:'#204532'},
  CORE: {fill:'#dff3f1',stroke:'#278b83',text:'#174a46'},
  EVIDENCE: {fill:'#fff6d8',stroke:'#b28c25',text:'#51400d'},
  EXCEPTION: {fill:'#ffeaeb',stroke:'#c46670',text:'#5c2930'},
  IMPLEMENTATION: {fill:'#f1eafd',stroke:'#8a66b5',text:'#3d2c54'},
  PROPERTY: {fill:'#edf1f3',stroke:'#74838d',text:'#34434c'},
};
// Encode labels instead of inserting YAML values as Mermaid syntax or HTML.
const label = value => Array.from(String(value), c => /[a-zA-Z0-9 _.,:-]/.test(c) ? c : `#${c.codePointAt(0)};`).join('');
const node = (id, text) => `${id}["${label(text)}"]`;
const layerClass = layer => `layer_${layer.toLowerCase()}`;
const colorForLayer = layer => layerColors[layer] || {fill:'#edf1f3',stroke:'#74838d',text:'#34434c'};

function renderLegend(units) {
  const legend = $('legend');
  legend.replaceChildren();
  const layers = [...new Set(units.map(unit => unit.layer))];
  legend.hidden = $('view').value !== 'units' || layers.length === 0;
  for (const layer of layers) {
    const color = colorForLayer(layer);
    const item = document.createElement('span');
    item.className = 'legend-item';
    const swatch = document.createElement('span');
    swatch.className = 'legend-swatch';
    swatch.style.backgroundColor = color.fill;
    swatch.style.borderColor = color.stroke;
    const name = document.createElement('span');
    name.textContent = layer;
    item.append(swatch, name);
    legend.append(item);
  }
}

function positionTooltip(x, y) {
  const tooltip = $('tooltip');
  const margin = 12;
  tooltip.style.left = `${Math.max(margin, Math.min(x + 14, window.innerWidth - tooltip.offsetWidth - margin))}px`;
  tooltip.style.top = `${Math.max(margin, Math.min(y + 14, window.innerHeight - tooltip.offsetHeight - margin))}px`;
}

function showTooltip(unit, x, y) {
  const tooltip = $('tooltip');
  tooltip.replaceChildren();
  const title = document.createElement('h3');
  title.textContent = unit.id;
  const provision = document.createElement('p');
  provision.textContent = unit.provision || '';
  const summary = document.createElement('p');
  summary.textContent = unit.summary;
  const attributes = document.createElement('pre');
  attributes.textContent = JSON.stringify(unit, null, 2);
  tooltip.append(title, provision, summary, attributes);
  tooltip.hidden = false;
  positionTooltip(x, y);
}

function connectUnitTooltips(svg, visible) {
  const unitsByToken = new Map(visible.map((unit, index) => [`U${index}`, unit]));
  for (const element of svg.querySelectorAll('g.node')) {
    const token = element.id.match(/^flowchart-(U\d+)-/)?.[1];
    const unit = unitsByToken.get(token);
    if (!unit) continue;

    const description = `${unit.id} · ${unit.provision || ''} · ${unit.summary}`;
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', `${unit.id}, focus or hover to inspect attributes`);
    const nativeTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    nativeTitle.textContent = description;
    element.prepend(nativeTitle);
    element.addEventListener('pointerenter', event => showTooltip(unit, event.clientX, event.clientY));
    element.addEventListener('pointermove', event => positionTooltip(event.clientX, event.clientY));
    element.addEventListener('pointerleave', () => { $('tooltip').hidden = true; });
    element.addEventListener('focus', () => {
      const bounds = element.getBoundingClientRect();
      showTooltip(unit, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    });
    element.addEventListener('blur', () => { $('tooltip').hidden = true; });
  }
}

function connectLevelTooltips(svg, matches) {
  const levelsByToken = new Map(data.levels.map((level, index) => [`L${index}`, level]));
  for (const element of svg.querySelectorAll('g.node')) {
    const token = element.id.match(/^flowchart-(L\d+)-/)?.[1];
    const level = levelsByToken.get(token);
    if (!level) continue;

    const units = matches.filter(unit => unit.level === level.level);
    const tooltip = $('tooltip');
    const description = `${level.number} ${level.level}; ${units.length} matching units`;
    element.setAttribute('tabindex', '0');
    element.setAttribute('aria-label', `${description}, focus or hover to inspect level details`);
    const nativeTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    nativeTitle.textContent = description;
    element.prepend(nativeTitle);

    const show = (x, y) => {
      tooltip.replaceChildren();
      const title = document.createElement('h3');
      title.textContent = `${level.number} ${level.level}`;
      const parent = document.createElement('p');
      parent.textContent = level.parent ? `Parent: ${level.parent}` : 'Top-level chapter';
      const count = document.createElement('p');
      count.textContent = `${units.length} matching ${units.length === 1 ? 'unit' : 'units'}`;
      const list = document.createElement('pre');
      list.textContent = units.length
        ? units.slice(0, 8).map(unit => `${unit.id} · ${unit.provision}`).join('\n') +
          (units.length > 8 ? `\n… and ${units.length - 8} more` : '')
        : 'No units assigned directly to this level.';
      tooltip.append(title, parent, count, list);
      tooltip.hidden = false;
      positionTooltip(x, y);
    };

    element.addEventListener('pointerenter', event => show(event.clientX, event.clientY));
    element.addEventListener('pointermove', event => positionTooltip(event.clientX, event.clientY));
    element.addEventListener('pointerleave', () => { tooltip.hidden = true; });
    element.addEventListener('focus', () => {
      const bounds = element.getBoundingClientRect();
      show(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    });
    element.addEventListener('blur', () => { tooltip.hidden = true; });
  }
}

function render() {
  const current = ++revision;
  $('tooltip').hidden = true;
  $('diagram').classList.toggle('hierarchy-view', $('view').value === 'levels');
  const term = $('search').value.toLowerCase();
  const matches = data.units.filter(u =>
    (!$('level').value || u.level === $('level').value) &&
    (!$('layer').value || u.layer === $('layer').value) &&
    `${u.id} ${u.provision || ''} ${u.summary}`.toLowerCase().includes(term));
  const visibleUnits = matches.slice(pageOffset, pageOffset + pageSize);
  renderLegend(visibleUnits);
  $('previous').hidden = $('view').value !== 'units' || pageOffset === 0;
  $('next').hidden = $('view').value !== 'units' || pageOffset + pageSize >= matches.length;
  $('previous').disabled = pageOffset === 0;
  $('next').disabled = pageOffset + pageSize >= matches.length;
  $('rows').replaceChildren();
  for (const u of matches) {
    const tr = document.createElement('tr');
    for (const value of [u.id, u.summary, u.layer]) {
      const td = document.createElement('td'); td.textContent = value; tr.append(td);
    }
    const details = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = 'Attributes';
    const pre = document.createElement('pre'); pre.textContent = JSON.stringify(u, null, 2);
    details.append(summary, pre); tr.children[1].append(details); $('rows').append(tr);
  }
  const lines = ['flowchart LR'];
  if ($('view').value === 'levels') {
    const ids = new Map(data.levels.map((l,i) => [l.level, `L${i}`]));
    for (const l of data.levels) {
      const count = matches.filter(u => u.level === l.level).length;
      lines.push(node(ids.get(l.level), `${l.number} ${l.level} (${count} matching units)`));
      if (l.parent && ids.has(l.parent)) lines.push(`${ids.get(l.parent)} --> ${ids.get(l.level)}`);
    }
  } else {
    const ids = new Map(visibleUnits.map((u,i) => [u.id, `U${i}`]));
    const layers = [...new Set(visibleUnits.map(u => u.layer))];
    for (const [i, layer] of layers.entries()) {
      lines.push(`subgraph G${i}["${label(layer)}"]`);
      for (const u of visibleUnits.filter(u => u.layer === layer)) lines.push(node(ids.get(u.id), `${u.id}: ${u.summary.slice(0, 70)}`));
      lines.push('end');
    }
    for (const e of data.edges) if (ids.has(e.source) && ids.has(e.target)) {
      lines.push(`${ids.get(e.source)} -->|${e.relation}| ${ids.get(e.target)}`);
    }
    for (const layer of layers) {
      const color = colorForLayer(layer);
      lines.push(`classDef ${layerClass(layer)} fill:${color.fill},stroke:${color.stroke},color:${color.text},stroke-width:1.5px`);
    }
    for (const unit of visibleUnits) lines.push(`class ${ids.get(unit.id)} ${layerClass(unit.layer)}`);
  }
  const source = lines.join('\n'); $('source').textContent = source;
  const start = matches.length ? pageOffset + 1 : 0;
  const end = Math.min(pageOffset + pageSize, matches.length);
  $('status').textContent = `${data.units.length} units · ${data.levels.length} levels · ${data.edges.length} explicit relations · ${matches.length} matching units${$('view').value === 'units' ? ` · showing ${start}–${end}` : ''}`;
  if (lines.length === 1) { $('diagram').textContent = 'No matching units.'; return; }
  if (!mermaid) { $('diagram').textContent = 'Mermaid could not load. Check internet access to cdn.jsdelivr.net, then refresh. The unit table and source remain available.'; return; }
  mermaid.render(`graph${current}`, source).then(({svg}) => {
    if (current === revision) {
      $('diagram').innerHTML = svg;
      if ($('view').value === 'units') connectUnitTooltips($('diagram'), visibleUnits);
      else connectLevelTooltips($('diagram'), matches);
    }
  }).catch(error => { if (current === revision) $('diagram').textContent = `Diagram error: ${error.message}`; });
}

try {
  const response = await fetch('/api/model');
  if (!response.ok) throw new Error(`Model request failed (${response.status})`);
  data = await response.json();
  for (const [field, values] of [['level', data.levels.map(l => l.level)], ['layer', [...new Set(data.units.map(u => u.layer))].sort()]]) {
    for (const value of values) { const option = document.createElement('option'); option.value = value; option.textContent = value; $(field).append(option); }
  }
  try {
    ({default: mermaid} = await import('https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs'));
    mermaid.initialize({startOnLoad:false, securityLevel:'strict', theme:'neutral', flowchart:{htmlLabels:false}, maxEdges:2000});
  } catch (error) { console.error(error); }
  for (const id of ['view', 'level', 'layer', 'page-size']) $(id).addEventListener('change', () => {
    pageOffset = 0;
    pageSize = Number($('page-size').value);
    render();
  });
  $('search').addEventListener('input', () => {
    pageOffset = 0;
    render();
  });
  $('previous').addEventListener('click', () => {
    pageOffset = Math.max(0, pageOffset - pageSize);
    render();
  });
  $('next').addEventListener('click', () => {
    pageOffset += pageSize;
    render();
  });
  $('download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([$('source').textContent], {type:'text/plain'}));
    const a = document.createElement('a'); a.href = url; a.download = 'legal-metamodel.mmd'; a.click(); URL.revokeObjectURL(url);
  });
  render();
} catch (error) { $('status').textContent = error.message; }
