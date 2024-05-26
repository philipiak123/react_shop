// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Importowanie pakietu cors


const app = express();
const port = 5000;



const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Ustaw swoje hasło
  database: 'react_shop'
});

app.use(bodyParser.json());

// Konfiguracja cors
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Tutaj ustaw adres swojej aplikacji React
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Wykonujemy parametryzowane zapytanie SQL
  db.query('SELECT * FROM uzytkownicy WHERE email = ?', [email], async (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Błąd serwera' });
    } else if (result.length === 0) {
      res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    } else {
      const user = result[0];
      try {
        if (await bcrypt.compare(password, user.pass)) {
          // Przesyłanie całego obiektu użytkownika w odpowiedzi
          res.json({ 
            message: 'Zalogowano pomyślnie',
            user: user // Przesyłanie całego obiektu użytkownika
          });
        } else {
          res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Błąd serwera' });
      }
    }
  });
});

app.post('/addreview', (req, res) => {
  const { id_produktu, id_usera, ocena, tresc } = req.body;

  // Sprawdź czy ocena mieści się w przedziale od 1 do 5
  if (ocena < 1 || ocena > 5) {
    return res.status(400).json({ error: 'Ocena musi być w przedziale od 1 do 5.' });
  }

  // Wstawienie opinii do bazy danych
  const query = 'INSERT INTO opinie (id_produktu, id_usera, ocena, tresc, data) VALUES (?, ?, ?, ?, NOW())';
  db.query(query, [id_produktu, id_usera, ocena, tresc], (err, result) => {
    if (err) {
      console.error('Błąd zapisu opinii do bazy danych:', err);
      return res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
    }
    res.status(201).json({ message: 'Opinia została pomyślnie dodana.' });
  });
});

app.get('/reviews/:productId', (req, res) => {
  const productId = req.params.productId;

  // Zapytanie do bazy danych w celu pobrania opinii dla danego produktu
  const query = 'SELECT * FROM opinie WHERE id_produktu = ?';
  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Błąd pobierania opinii z bazy danych:', err);
      return res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
    }
    res.json(results);
  });
});

app.post('/order', (req, res) => {
  const { userId, cart } = req.body;

  // Wstawienie zamówienia do bazy danych
  const query = 'INSERT INTO zamowienia (user_id, data, status) VALUES (?, ?, "niezrealizowane")';
  const productsJSON = JSON.stringify(cart); // Zamiana tablicy produktów na JSON
  db.query(query, [userId, productsJSON], (err, result) => {
    if (err) {
      console.error('Błąd zapisu zamówienia do bazy danych:', err);
      res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
      return;
    }
    res.status(201).json({ message: 'Zamówienie zostało pomyślnie złożone.' });
  });
});



app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Sprawdzamy czy hasło ma przynajmniej 8 znaków
  if (password.length < 8) {
    res.status(400).json({ error: 'Hasło musi zawierać przynajmniej 8 znaków.' });
    return;
  }

  // Sprawdzamy czy użytkownik o podanym emailu już istnieje w bazie danych
  const query = 'SELECT * FROM uzytkownicy WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Błąd zapytania do bazy danych:', err);
      res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
      return;
    }
    if (results.length > 0) {
      res.status(400).json({ error: 'Użytkownik o podanym adresie email już istnieje.' });
      return;
    }

    // Haszowanie hasła przed zapisaniem do bazy danych
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Błąd hashowania hasła:', hashErr);
        res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
        return;
      }

      // Zapisanie nowego użytkownika do bazy danych z dodanym typem 'pacjent'
      const insertQuery = 'INSERT INTO uzytkownicy (email, pass, typ) VALUES (?, ?, ?)';
      const typ = 'pacjent';
      db.query(insertQuery, [email, hashedPassword, typ], (insertErr) => {
        if (insertErr) {
          console.error('Błąd zapisu nowego użytkownika do bazy danych:', insertErr);
          res.status(500).json({ error: 'Błąd serwera. Spróbuj ponownie później.' });
          return;
        }
        res.status(201).json({ message: 'Użytkownik został pomyślnie zarejestrowany.' });
      });
    });
  });
});


app.get('/shop', (req, res) => {
  let sql = `
    SELECT produkty.*, 
       AVG(opinie.ocena) AS srednia_ocena 
    FROM produkty 
    LEFT JOIN opinie ON produkty.id = opinie.id_produktu 
    GROUP BY produkty.id`;

  // Obsługa filtrów
  let filters = [];

  if (req.query.priceFrom) {
    filters.push(`cena >= ${parseFloat(req.query.priceFrom)}`);
  }

  if (req.query.priceTo) {
    filters.push(`cena <= ${parseFloat(req.query.priceTo)}`);
  }

  if (filters.length > 0) {
    sql += ` HAVING ${filters.join(' AND ')}`;
  }

  // Obsługa sortowania
  if (req.query.sortBy) {
    let sortBy = '';
    switch (req.query.sortBy) {
      case 'cena_asc':
        sortBy = 'cena ASC';
        break;
      case 'cena_desc':
        sortBy = 'cena DESC';
        break;
      case 'nazwa_asc':
        sortBy = 'nazwa ASC';
        break;
      case 'nazwa_desc':
        sortBy = 'nazwa DESC';
        break;
      case 'ocena_asc':
        sortBy = 'srednia_ocena ASC';
        break;
      case 'ocena_desc':
        sortBy = 'srednia_ocena DESC';
        break;
      default:
        sortBy = 'cena ASC';
        break;
    }
    sql += ` ORDER BY ${sortBy}`;
  }

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Błąd wykonania kwerendy SELECT: ', err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
      return;
    }
    res.json(results);
  });
});


// Endpoint do pobierania szczegółów produktu na podstawie ID
app.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  const sql = `SELECT * FROM produkty WHERE id = ?`;
  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.error('Błąd wykonania kwerendy SELECT: ', err);
      res.status(500).json({ error: 'Wystąpił błąd serwera' });
      return;
    }
    res.json(results[0]);
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
