const form = document.getElementById('BurgerForm');
const huwelijkForm = document.getElementById('HuwelijkForm');
const kindForm = document.getElementById('KindForm');
const list = document.getElementById('Burgers');
const tooltip = document.getElementById('tooltip');
let allBurgers = [];

// Burgers ophalen
function loadBurgers() {
  fetch('/api/burgers')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      allBurgers = data || [];
      displayBurgers(allBurgers);
    })
    .catch(err => {
      console.error(err);
      showTooltip('Fout bij laden burgers');
    });
}

// Lijst tonen met ID + knoppen
function displayBurgers(burgers) {
  list.innerHTML = '';
  burgers.forEach(b => {
    const date = b.Geboortedatum ? new Date(b.Geboortedatum).toISOString().split('T')[0] : '';
    const li = document.createElement('li');
    // escape quotes in strings to avoid breaking onclick attributes
    const voor = (b.Voornaam || '').replace(/"/g, '&quot;');
    const ach = (b.Achternaam || '').replace(/"/g, '&quot;');
    const dna = (b.DNA_code || '').replace(/"/g, '&quot;');
    const fam = (b.Familie_code || '').replace(/"/g, '&quot;');

    li.innerHTML = `
      <strong>ID: ${b.Burger_id} – ${voor} ${ach}</strong>
      - ${date} - DNA: ${dna} - Familie: ${fam}
      <br>
      <button type="button" onclick='editBurger(${b.Burger_id}, "${voor}", "${ach}", "${date}", "${dna}", "${fam}")'>Bewerken</button>
      <button type="button" onclick='deleteBurger(${b.Burger_id})'>Verwijderen</button>
    `;
    list.appendChild(li);
  });
}

// Tooltip tonen
function showTooltip(message) {
  if (!tooltip) return;
  tooltip.innerText = message;
  tooltip.style.display = 'block';
  clearTimeout(showTooltip._timeout);
  showTooltip._timeout = setTimeout(() => {
    tooltip.style.display = 'none';
  }, 3000);
}

// --- CRUD handlers ---

// Standaard add submit handler (wordt gebruikt als default)
function addSubmitHandler(e) {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  fetch('/api/burgers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      form.reset();
      loadBurgers();
      showTooltip('Nieuwe burger succesvol toegevoegd!');
    } else {
      alert('Fout: ' + (result.error || 'Onbekend probleem'));
    }
  })
  .catch(err => {
    console.error(err);
    alert('Netwerkfout bij toevoegen burger');
  });
}

// Update handler voor bestaande burger
function updateSubmitHandler(e) {
  e.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const id = data.Burger_id || form.elements['Burger_id'].value;

  if (!id) {
    alert('Geen Burger_id gevonden voor update.');
    return;
  }

  fetch(`/api/burgers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      form.reset();
      loadBurgers();
      showTooltip('Burger succesvol bijgewerkt!');
    } else {
      alert('Fout bij bijwerken: ' + (result.error || 'Onbekend probleem'));
    }
    // restore original submit handler
    form.removeEventListener('submit', updateSubmitHandler);
    form.addEventListener('submit', addSubmitHandler);
  })
  .catch(err => {
    console.error(err);
    alert('Netwerkfout bij bijwerken burger');
    form.removeEventListener('submit', updateSubmitHandler);
    form.addEventListener('submit', addSubmitHandler);
  });
}

// Burger bewerken - vult formulier en verandert submit naar PUT
function editBurger(id, voornaam, achternaam, geboortedatum, dna, familie) {
  // Vul formulier velden (veronderstelt input name attributen)
  if (!form) return;
  if (!form.elements['Burger_id']) {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'Burger_id';
    form.appendChild(hidden);
  }

  form.elements['Burger_id'].value = id;
  if (form.elements['Voornaam']) form.elements['Voornaam'].value = voornaam || '';
  if (form.elements['Achternaam']) form.elements['Achternaam'].value = achternaam || '';
  if (form.elements['Geboortedatum']) form.elements['Geboortedatum'].value = geboortedatum || '';
  if (form.elements['DNA_code']) form.elements['DNA_code'].value = dna || '';
  if (form.elements['Familie_code']) form.elements['Familie_code'].value = familie || '';

  // Vervang submit handler voor update
  form.removeEventListener('submit', addSubmitHandler);
  form.addEventListener('submit', updateSubmitHandler);

  showTooltip('Bewerk modus: pas gegevens aan en klik opslaan');
}

// Burger verwijderen
function deleteBurger(id) {
  if (!confirm('Weet je zeker dat je deze burger wilt verwijderen?')) return;

  fetch(`/api/burgers/${id}`, {
    method: 'DELETE'
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      loadBurgers();
      showTooltip('Burger succesvol verwijderd!');
    } else {
      alert('Fout bij verwijderen: ' + (result.error || 'Onbekend probleem'));
    }
  })
  .catch(err => {
    console.error(err);
    alert('Netwerkfout bij verwijderen burger');
  });
}

// --- Huwelijk registreren ---
if (huwelijkForm) {
  huwelijkForm.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(huwelijkForm);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/huwelijk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        huwelijkForm.reset();
        loadBurgers();
        showTooltip('Huwelijk succesvol geregistreerd!');
      } else {
        alert('Fout bij huwelijk: ' + (result.error || 'Onbekend probleem'));
      }
    })
    .catch(err => {
      console.error(err);
      alert('Netwerkfout bij huwelijk registreren');
    });
  });
}

// --- Kind registreren ---
if (kindForm) {
  kindForm.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(kindForm);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/kind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        kindForm.reset();
        loadBurgers();
        showTooltip('Kind succesvol geregistreerd!');
      } else {
        alert('Fout bij kind registreren: ' + (result.error || 'Onbekend probleem'));
      }
    })
    .catch(err => {
      console.error(err);
      alert('Netwerkfout bij kind registreren');
    });
  });
}

// Init: voeg standaard add handler toe en laad burgers
function init() {
  if (!form) return;
  // Zorg dat formulier een hidden veld Burger_id heeft (voor update)
  if (!form.elements['Burger_id']) {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'Burger_id';
    form.appendChild(hidden);
  }

  // Bind add handler
  form.addEventListener('submit', addSubmitHandler);
  loadBurgers();
}

// Expose edit/delete to global scope zodat inline onclick werkt
window.editBurger = editBurger;
window.deleteBurger = deleteBurger;

init();
