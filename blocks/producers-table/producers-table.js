const SHEET_URL = 'https://docs.google.com/spreadsheets/d/14NcW8hmPS4398rf0Ht6x2h9VikATwlPPgv9T3_-sldA/export?format=csv';

export default async function decorate(block) {
  const res = await fetch(SHEET_URL);
  const text = await res.text();

  const rows = parseCSV(text);
  const headers = rows.shift();
  const data = rows.map(r => ({
    country: r[0],
    producent: r[1],
    omrade: r[2],
    imageUrl: r[3],
    docUrl: r[4],
    embedUrl: r[5],
    productUrl: r[6]
  }));

  // Modal container
  const modal = document.createElement('div');
  modal.id = 'producent-modal';
  modal.classList.add('show');

  // Modal content
  const modalContent = document.createElement('div');
  modalContent.id = 'producent-modal-content';

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

// Close modal on click outside content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Create country dropdown
  const countrySelect = document.createElement('select');
  countrySelect.id = 'country-select';
  block.appendChild(countrySelect);

  // Create table container
  const tablesContainer = document.createElement('div');
  tablesContainer.id = 'country-tables';
  block.appendChild(tablesContainer);

  const countries = [...new Set(data.map(d => d.country))].filter(Boolean).sort();
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Alla länder';
  countrySelect.appendChild(defaultOption);

  countries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });

  function renderTable(country) {
    tablesContainer.innerHTML = '';
    const filtered = country ? data.filter(d => d.country === country) : data;

    const grouped = filtered.reduce((acc, cur) => {
      acc[cur.country] = acc[cur.country] || [];
      acc[cur.country].push(cur);
      return acc;
    }, {});

    for (const [country, entries] of Object.entries(grouped)) {
      const table = document.createElement('table');
      const caption = document.createElement('caption');
      caption.textContent = country;
      table.appendChild(caption);

      const thead = document.createElement('thead');
      thead.innerHTML = `<tr><th>Producent</th><th>Område</th><th>Bild</th></tr>`;  // Added image column header
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      entries.forEach((entry) => {
        const row = document.createElement('tr');
        row.innerHTML = `
    <td><a href="#" 
           class="producent-link" 
           data-producent="${entry.producent}" 
           data-country="${entry.country}"
           data-producent="${entry.producent}" 
           data-country="${entry.country}" 
           data-omrade="${entry.omrade}" 
           data-title="${entry.producent}">
      ${entry.producent}
    </a></td>
    <td>${entry.omrade}</td>
    <td>${entry.imageUrl ? `<img src="${entry.imageUrl}" alt="Bild" style="max-width:100px; height:auto;">` : ''}</td>
  `;
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      tablesContainer.appendChild(table);
    }
  }

  countrySelect.addEventListener('change', (e) => {
    renderTable(e.target.value);
  });

  renderTable(''); // render all by default

  tablesContainer.addEventListener('click', (e) => {
    const link = e.target.closest('.producent-link');
    if (!link) return;

    e.preventDefault();

    const producent = link.dataset.producent;
    const country = link.dataset.country;
    const item = data.find(d => d.producent === producent && d.country === country);
    if (!item) return;

    modalContent.innerHTML = `
    <div class="modal-scroll">
        <h2>${item.title || ''}</h2>
        <p><strong>Producent:</strong> ${item.producent}</p>
        <p><strong>Land:</strong> ${item.country}</p>
        <p><strong>Område:</strong> ${item.omrade}</p>
        <p><strong>Beskrivning:</strong> ${item.docUrl}</p>
        <div id="video-embed"></div>
        <button id="close-modal" style="margin-top:1rem;">&times;</button>
    </div> 
  `;

    const videoContainer = document.getElementById('video-embed');
    if (item.embedUrl) {
      videoContainer.innerHTML = `
      <iframe width="560" height="315"
              src="${item.embedUrl}"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen>
      </iframe>`;
    }

    modal.style.display = 'flex';

    document.getElementById('close-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
    });
  });

  // Close modal function
  function closeModal() {
    modal.style.display = 'none';
  }

}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // Look ahead to see if this is an escaped quote
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field.trim());
        field = '';
      } else if (char === '\r' && text[i + 1] === '\n') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        i++; // Skip '\n'
      } else if (char === '\n' || char === '\r') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }

    i++;
  }

  // Push last row if needed
  if (field.length > 0 || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  return rows;
}
