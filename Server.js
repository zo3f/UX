const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'xampp-root',
  database: 'bevolkingsregister_db'
});

db.connect(err => {
  if (err) console.error('Databasefout:', err);
  else console.log('Verbonden met de database');
});

// Alle burgers ophalen
app.get('/api/burgers', (req, res) => {
  db.query('SELECT * FROM burgers', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Nieuwe burger toevoegen
app.post('/api/burgers', (req, res) => {
  const { Voornaam, Achternaam, Geboortedatum, DNA_code, Familie_code } = req.body;
  if (!Voornaam || !Achternaam || !Geboortedatum || !DNA_code || !Familie_code)
    return res.status(400).json({ error: 'Alle velden zijn verplicht' });

  db.query(
    'INSERT INTO burgers (Voornaam, Achternaam, Geboortedatum, DNA_code, Familie_code) VALUES (?, ?, ?, ?, ?)',
    [Voornaam, Achternaam, Geboortedatum, DNA_code, Familie_code],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// Bestaande burger bewerken
app.put('/api/burgers/:id', (req, res) => {
  const { id } = req.params;
  const { Voornaam, Achternaam, Geboortedatum, DNA_code, Familie_code } = req.body;

  db.query(
    'UPDATE burgers SET Voornaam=?, Achternaam=?, Geboortedatum=?, DNA_code=?, Familie_code=? WHERE Burger_id=?',
    [Voornaam, Achternaam, Geboortedatum, DNA_code, Familie_code, id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Burger verwijderen
app.delete('/api/burgers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM burgers WHERE Burger_id=?', [id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Huwelijk registreren met inteeltcontrole
app.post('/api/huwelijk', (req, res) => {
  const { partner1_id, partner2_id, datum, force } = req.body;

  if (!partner1_id || !partner2_id || !datum) {
    return res.status(400).json({ error: 'Alle velden zijn verplicht' });
  }

  // Ophalen DNA
  db.query(
    'SELECT Burger_id, DNA_code FROM burgers WHERE Burger_id IN (?, ?)',
    [partner1_id, partner2_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length !== 2) return res.status(404).json({ error: 'Een of beide burgers bestaan niet' });

      const dna1 = results.find(b => b.Burger_id == partner1_id).DNA_code || '';
      const dna2 = results.find(b => b.Burger_id == partner2_id).DNA_code || '';

      // Familiecode = DNA1 + DNA2
      const familiecode = dna1 + dna2;

      // Kind-DNA simulatie = DNA1 + DNA2 (bijv. AB + AB => AABB)
      const kindDNA = (dna1 + dna2).split('').sort().join('');

      // Bereken inteelt%
      const counts = {};
      for (const ch of kindDNA) counts[ch] = (counts[ch] || 0) + 1;

      const total = kindDNA.length;
      const duplicateLetters = Object.values(counts)
        .filter(c => c >= 2)
        .reduce((sum, c) => sum + c, 0);

      const inbreeding = total > 0 ? Math.round((duplicateLetters / total) * 100) : 0;

            if (!force) {
        return res.json({
          warning: true,
          message: `Inteeltcontrole: mogelijk kind-DNA ${kindDNA}. Inteelt: ${inbreeding}%`,
          inbreeding,
          kindDNA,
          familiecode
        });
      }

      // Huwelijk definitief registreren
      db.query(
        'INSERT INTO huwelijken (Partner1_id, Partner2_id, Datum, Familie_code) VALUES (?, ?, ?, ?)',
        [partner1_id, partner2_id, datum, familiecode],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });

          // Familiecode updaten
          db.query(
            'UPDATE burgers SET Familie_code = ? WHERE Burger_id IN (?, ?)',
            [familiecode, partner1_id, partner2_id],
            (err2) => {
              if (err2) return res.status(500).json({ error: err2.message });
              res.json({ success: true, familiecode, inbreeding, kindDNA });
            }
          );
        }
      );
    }
  );
});

// Kind registreren
app.post('/api/kind', (req, res) => {
  const { ouder1_id, ouder2_id, voornaam, achternaam, geboortedatum } = req.body;

  if (!ouder1_id || !ouder2_id || !voornaam || !achternaam || !geboortedatum) {
    return res.status(400).json({ error: 'Alle velden zijn verplicht' });
  }

  // Familiecode ophalen uit huwelijk
  db.query(
    'SELECT Familie_code FROM huwelijken WHERE (Partner1_id = ? AND Partner2_id = ?) OR (Partner1_id = ? AND Partner2_id = ?)',
    [ouder1_id, ouder2_id, ouder2_id, ouder1_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Geen huwelijk gevonden tussen deze ouders' });

      const familiecode = results[0].Familie_code;
      const dnacode = familiecode; // DNA = familiecode

      //Kind toevoegen aan kinderen-tabel
      db.query(
        'INSERT INTO kinderen (Voornaam, Achternaam, Geboortedatum, Ouder1_id, Ouder2_id, DNA_code, Familie_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [voornaam, achternaam, geboortedatum, ouder1_id, ouder2_id, dnacode, familiecode],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          //Kind toevoegen aan burgers-tabel
          db.query(
            'INSERT INTO burgers (Voornaam, Achternaam, Geboortedatum, DNA_code, Familie_code) VALUES (?, ?, ?, ?, ?)',
            [voornaam, achternaam, geboortedatum, dnacode, familiecode],
            (err2) => {
              if (err2) return res.status(500).json({ error: err2.message });
              res.json({ success: true, message: 'Kind succesvol geregistreerd en toegevoegd aan burgers!' });
            }
          );
        }
      );
    }
  );
});

// Frontend routes
app.get('/Burger', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Burger.html')));
app.get('/Ambtenaar', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Ambtenaar.html')));
app.get('/', (req, res) => res.send('<a href="/Burger">Burger</a> | <a href="/Ambtenaar">Ambtenaar</a>'));

app.listen(port, () => console.log(`Server draait op http://localhost:${port}`));
