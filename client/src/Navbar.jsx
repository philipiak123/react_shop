import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Dodaj plik CSS dla stylizacji

const Navbar = ({ loggedIn, handleLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">Strona główna</Link>
        {loggedIn ? (
          <a onClick={handleLogout}>Wyloguj</a>
        ) : (
          <>
            <Link to="/logowanie">Logowanie</Link>
            <Link to="/rejestracja">Rejestracja</Link>
          </>
        )}
      </div>
      <div className="navbar-right">
        <Link to="/koszyk">Koszyk</Link>
      </div>
    </nav>
  );
};

export default Navbar;
