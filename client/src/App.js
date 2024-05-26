import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom'; // Poprawione importy
import axios from 'axios';
import ProductDetails from './ProductDetails';
import Navbar from './Navbar'; // Dodaj import do komponentu Navbar
import Login from './Login';
import Register from './Register';
import './Shop.css'; // Upewnij się, że importujesz plik CSS
import LoginForm from './LoginForm';


const Shop = ({ addToCart }) => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const [priceFrom, setPriceFrom] = useState(localStorage.getItem('priceFrom') || '');
  const [priceTo, setPriceTo] = useState(localStorage.getItem('priceTo') || '');
  const [sortBy, setSortBy] = useState(localStorage.getItem('sortBy') || 'cena_asc');
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoggedIn(true);
      const user = JSON.parse(localStorage.getItem('user'));
      setUserData(user);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUserData(userData);
    setLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLoggedIn(false);
    setUserData(null);
  };

  useEffect(() => {
    fetchData();
  }, [sortBy, priceFrom, priceTo]);

  useEffect(() => {
    localStorage.setItem('priceFrom', priceFrom);
    localStorage.setItem('priceTo', priceTo);
    localStorage.setItem('sortBy', sortBy);
  }, [priceFrom, priceTo, sortBy]);

  const fetchData = () => {
    const queryParams = `priceFrom=${priceFrom}&priceTo=${priceTo}&sortBy=${sortBy}`;
    axios.get(`http://localhost:5000/shop?${queryParams}`)
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error('Błąd pobierania danych: ', error);
      });
  };

  const handleFilter = () => {
    fetchData();
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div className="filter-container">
        <div className="filter-content">
          <h2 style={{ textAlign: 'center' }}>Filtry</h2>
          <p>Cena:</p>
          <div className="price-filter">
            <label htmlFor="priceFrom">Od:</label>
            <input
              type="number"
              id="priceFrom"
              placeholder="Cena od"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              className="price-input"
            />
            <label htmlFor="priceTo">Do:</label>
            <input
              type="number"
              id="priceTo"
              placeholder="Cena do"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
              className="price-input"
            />
          </div>
          <label htmlFor="sortBy">Sortowanie:</label>
          <select id="sortBy" value={sortBy} onChange={handleSortChange} className="sort-select">
            <option value="cena_asc">Cena rosnąco</option>
            <option value="cena_desc">Cena malejąco</option>
            <option value="nazwa_asc">Nazwa A-Z</option>
            <option value="nazwa_desc">Nazwa Z-A</option>
            <option value="ocena_asc">Ocena rosnąco</option>
            <option value="ocena_desc">Ocena malejąco</option>
          </select>
        </div>
      </div>
      <div style={{ flex: '4', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {products.map(product => (
            <div
              key={product.id}
              style={{ boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)', borderRadius: '10px', padding: '20px', backgroundColor: '#fff' }}
              onClick={() => handleProductClick(product.id)}
            >
              <h3>{product.nazwa}</h3>
              <img src={require(`./${product.photo1}`)} alt={product.name} style={{ width: '100%', marginBottom: '10px' }} />
              <p>Price: {product.cena}</p>
              <p>Ocena: {product.srednia_ocena}</p> 
              <button onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}>Dodaj do koszyka</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const Koszyk = ({ cart, setCart, increaseQuantity, decreaseQuantity, removeFromCart, loggedIn, userData }) => {
  const [totalPrice, setTotalPrice] = useState(calculateTotalPrice(cart));
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    setTotalPrice(calculateTotalPrice(cart));
  }, [cart]);

  function calculateTotalPrice(cart) {
    return cart.reduce((total, product) => total + product.cena * product.quantity, 0);
  }

  function handleChangeQuantity(product, e) {
    const newQuantity = parseInt(e.target.value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      const updatedProduct = { ...product, quantity: newQuantity };
      increaseQuantity(updatedProduct);
    }
  }

  const handleOrder = () => {
    if (loggedIn) {
      const orderDetails = {
        userId: userData.id,
        cart
      };

      axios.post('http://localhost:5000/order', orderDetails)
        .then(response => {
          console.log('Zamówienie złożone:', response.data);
          setCart([]); // Czyszczenie koszyka po złożeniu zamówienia
        })
        .catch(error => {
          console.error('Błąd składania zamówienia:', error);
        });
    } else {
      setShowPopup(true);
    }
  };

  return (
    <div className="cart-container">
      <h2>Koszyk</h2>
      {cart.length === 0 ? (
        <p className="empty-cart-message">Koszyk jest pusty</p>
      ) : (
        <div>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Ilość</th>
                <th>Cena jednostkowa</th>
                <th>Cena łączna</th>
                <th>Akcja</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => (
                <tr key={index}>
                  <td>{item.nazwa}</td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleChangeQuantity(item, e)}
                      className="quantity-input"
                    />
                  </td>
                  <td>{item.cena} zł</td>
                  <td>{(item.cena * item.quantity).toFixed(2)} zł</td>
                  <td>
                    <button onClick={() => decreaseQuantity(item)} className="action-button">-</button>
                    <button onClick={() => increaseQuantity(item)} className="action-button">+</button>
                    <button onClick={() => removeFromCart(item)} className="action-button">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="total-price">Suma: {totalPrice.toFixed(2)} zł</p>
          <button onClick={handleOrder} className="order-button">Złóż zamówienie</button>
        </div>
      )}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <p>Musisz być zalogowany, aby złożyć zamówienie</p>
            <button onClick={() => setShowPopup(false)}>Zamknij</button>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

const addToCart = (product) => {
  const existingItem = cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += product.quantity || 1; // Ustawienie domyślnej wartości ilości na 1
    setCart([...cart]);
  } else {
    setCart([...cart, { ...product, quantity: product.quantity || 1 }]); // Ustawienie domyślnej wartości ilości na 1
  }
};

  const removeFromCart = (productToRemove) => {
  const updatedCart = cart.filter(item => item.id !== productToRemove.id);
  setCart(updatedCart);
};


  const increaseQuantity = (product) => {
    product.quantity += 1;
    setCart([...cart]);
  };

  const decreaseQuantity = (product) => {
    if (product.quantity > 1) {
      product.quantity -= 1;
      setCart([...cart]);
    }
  };

  const handleLogin = (userData) => {
    setUserData(userData);
    setLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLoggedIn(false);
    setUserData(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoggedIn(true);
      const user = JSON.parse(localStorage.getItem('user'));
      setUserData(user);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  return (
<Router>
  <div className="app">
    <Navbar loggedIn={loggedIn} handleLogout={handleLogout} />
    <div className="content">
      <Routes>
		<Route path="/logowanie" element={<LoginForm handleLogin={handleLogin} />} />
        <Route path="/rejestracja" element={<Register />} />
        <Route
          path="/"
          element={<Shop addToCart={addToCart} loggedIn={loggedIn} userData={userData} />}
        />
        <Route
          path="/product/:id"
          element={<ProductDetails addToCart={addToCart} loggedIn={loggedIn} userData={userData} />}
        />
        <Route
  path="/koszyk"
  element={<Koszyk
              cart={cart}
              setCart={setCart} // Przekazanie setCart do komponentu Koszyk
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
              removeFromCart={removeFromCart}
              loggedIn={loggedIn}
              userData={userData}
          />}
/>

      </Routes>
    </div>
  </div>
</Router>

  );
};

export default App;
