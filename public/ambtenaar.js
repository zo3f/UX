const form = document.getElementById('BurgerForm');
const huwelijkForm = document.getElementById('HuwelijkForm');
const kindForm = document.getElementById('KindForm');
const list = document.getElementById('Burgers');
let allBurgers = [];

// Burgers ophalen
function loadBurgers() {
  fetch('/api/burgers')
    .then(res => res.json())
    .then(data => {
      allBurgers = data;
      displayBurgers(allBurgers);
    })
    .catch(err => console.error(err));
}

// Lijst tonen met ID + knoppen
function displayBurgers(burgers) {
  list.innerHTML = '';
  burgers.forEach(b => {
    const date = new Date(b.Geboortedatum).toISOString().split('T')[0];
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>ID: ${b.Burger_id} – ${b.Voornaam} ${b.Achternaam}</strong>
      - ${date} - DNA: ${b.DNA_code} - Familie: ${b.Familie_code}
      <br>
      <button onclick='editBurger(${b.Burger_id}, "${b.Voornaam}", "${b.Achternaam}", "${date}", "${b.DNA_code}", "${b.Familie_code}")'>Bewerken</button>
      <button onclick='deleteBurger(${b.Burger_id})'>Verwijderen</button>
    `;
    list.appendChild(li);
  });
} 

// Nieuwe burger toevoegen
form.addEventListener('submit', e => {
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
    } else {
      alert('Fout: ' + (result.error || 'Onbekend probleem'));
    }
  });
});

// Burger verwijderen
function deleteBurger(id) {
  if (!confirm('Weet je zeker dat je deze burger wilt verwijderen?')) return;
  fetch('/api/burgers/' + id, { method: 'DELETE' })
    .then(res => res.json())
    .then(result => {
      if (result.success) loadBurgers();
    });
}

// Burger bewerken
function editBurger(id, Voornaam, Achternaam, Geboortedatum, DNA_code, Familie_code) {
  const newVoornaam = prompt('Nieuwe Voornaam:', Voornaam);
  const newAchternaam = prompt('Nieuwe Achternaam:', Achternaam);
  const newGeboortedatum = prompt('Nieuwe Geboortedatum (YYYY-MM-DD):', Geboortedatum);
  const newDNA = prompt('Nieuwe DNA-code:', DNA_code);
  const newFamilie = prompt('Nieuwe Familie-code:', Familie_code);

  if (!newVoornaam || !newAchternaam || !newGeboortedatum || !newDNA || !newFamilie) return alert('Alle velden zijn verplicht');

  fetch('/api/burgers/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Voornaam: newVoornaam,
      Achternaam: newAchternaam,
      Geboortedatum: newGeboortedatum,
      DNA_code: newDNA,
      Familie_code: newFamilie
    })
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) loadBurgers();
  });
}

// Huwelijk met inteeltcheck
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
    .then(check => {
      if (check.warning) {
        const doorgaan = confirm(
          `${check.message}\n\nFamiliecode huwelijk: ${check.familiecode}\nWil je dit huwelijk definitief registreren?`
        );
        if (!doorgaan) return;
        
        return fetch('/api/huwelijk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, force: true })
        })
        .then(res => res.json())
        .then(final => {
          if (final.success) {
            alert(`Huwelijk geregistreerd. Inteelt: ${final.inbreeding}%. Kind-DNA: ${final.kindDNA}`);
            huwelijkForm.reset();
            loadBurgers();
          } else {
            alert('Fout: ' + (final.error || 'Onbekend probleem'));
          }
        });
      }
      
      if (check.success) {
        alert(`Huwelijk geregistreerd. Inteelt: ${check.inbreeding}%. Kind-DNA: ${check.kindDNA}`);
        huwelijkForm.reset();
        loadBurgers();
      } else if (check.error) {
        alert('Fout: ' + check.error);
      }
    });
  });
}

// Kind opslaan
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
      alert(result.message);
      kindForm.reset();
      loadBurgers();
    } else {
      alert('Fout: ' + (result.error || 'Onbekend probleem'));
    }
  });
});

loadBurgers();
