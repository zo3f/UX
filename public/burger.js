const input = document.getElementById('searchInput');
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

// Lijst tonen
function displayBurgers(burgers) {
  list.innerHTML = '';
  burgers.forEach(b => {
    const date = new Date(b.Geboortedatum).toISOString().split('T')[0];
    const li = document.createElement('li');
    li.innerHTML = `<strong>ID: ${b.Burger_id} – ${b.Voornaam} ${b.Achternaam}</strong> - ${date} - DNA: ${b.DNA_code} - Familie: ${b.Familie_code}`;
    list.appendChild(li);
  });
}

// Zoeken/filteren
input.addEventListener('input', () => {
  const term = input.value.toLowerCase();
  displayBurgers(allBurgers.filter(b =>
    b.Voornaam.toLowerCase().includes(term) ||
    b.Achternaam.toLowerCase().includes(term)
  ));
});

loadBurgers();