const SHEET_URL = 'https://docs.google.com/spreadsheets/d/14NcW8hmPS4398rf0Ht6x2h9VikATwlPPgv9T3_-sldA/export?format=csv';

export default async function decorate(block) {
  const res = await fetch(SHEET_URL);
  const text = await res.text();

  const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
  const headers = rows.shift();
  const data = rows.map(r => ({
    country: r[0],
    producent: r[1],
    omrade: r[2],
    imageUrl: r[3]
  }));

  // Modal container
  const modal = document.createElement('div');
  modal.id = 'producent-modal';

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
      entries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><a href="#" class="producent-link" data-producent='${entry.producent}' data-country='${entry.country}' data-omrade='${entry.omrade}' data-title='${entry.producent}'>${entry.producent}</a></td>
          <td>${entry.omrade}</td>
          <td>${entry.imageUrl ? `<img src="${entry.imageUrl}" alt="Bild" style="max-width:100px; height:auto;">` : ''}</td>
        `;  // Added image rendering
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
    if (link) {
      e.preventDefault();

      const producent = link.dataset.producent;
      const country = link.dataset.country;
      const omrade = link.dataset.omrade;
      const title = link.dataset.title;

      modalContent.innerHTML = `
        <div class="modal-scroll">
            <h2>${title}</h2>
            <p><strong>Producent:</strong> ${producent}</p>
            <p><strong>Land:</strong> ${country}</p>
            <p><strong>Område:</strong> ${omrade}</p>
            <button id="close-modal" style="margin-top:1rem;">&times;</button>
        </div> 
        `;

      modal.style.display = 'flex';

      // Close button
      document.getElementById('close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
  });
}

