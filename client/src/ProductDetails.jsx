import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './ProductDetails.css';

const ProductDetails = ({ addToCart, loggedIn, userData }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(1);
  const [reviewText, setReviewText] = useState('');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/product/${id}`)
      .then(response => {
        setProduct(response.data);
      })
      .catch(error => {
        console.error('Błąd pobierania danych: ', error);
      });

    axios.get(`http://localhost:5000/reviews/${id}`)
      .then(response => {
        setReviews(response.data);
      })
      .catch(error => {
        console.error('Błąd pobierania opinii: ', error);
      });
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(isNaN(value) ? 1 : Math.max(1, value));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((currentImageIndex + 1) % productImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((currentImageIndex - 1 + productImages.length) % productImages.length);
  };

  const handleOpenReviewModal = () => {
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
  };

  const handleRatingChange = (e) => {
    setReviewRating(parseInt(e.target.value));
  };

  const handleSubmitReview = () => {
    const reviewData = {
      id_produktu: id,
      id_usera: userData.id,
      ocena: reviewRating,
      tresc: reviewText
    };

    axios.post('http://localhost:5000/addreview', reviewData)
      .then(response => {
        console.log(response.data.message);
        setIsReviewModalOpen(false);
        // Po dodaniu opinii pobieramy ponownie opinie dla aktualnego produktu
        axios.get(`http://localhost:5000/reviews/${id}`)
          .then(response => {
            setReviews(response.data);
          })
          .catch(error => {
            console.error('Błąd pobierania opinii: ', error);
          });
      })
      .catch(error => {
        console.error('Błąd dodawania opinii: ', error);
      });
  };

  if (!product) {
    return <div>Ładowanie...</div>;
  }

  const productImages = [product.photo1, product.photo2, product.photo3, product.photo4].filter(Boolean);

  return (
    <div className="product-details-container">
      <div style={{ padding: '20px', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="image-container">
            <button className="prev" onClick={handlePrevImage}>&#10094;</button>
            <img
              src={require(`./${productImages[currentImageIndex]}`)}
              alt={product.nazwa}
              className="product-image"
            />
            <button className="next" onClick={handleNextImage}>&#10095;</button>
          </div>
          <div style={{ flex: '1', textAlign: 'center' }}>
            <h2>{product.nazwa}</h2>
            <p>Cena: {product.cena} zł</p>
            <p>Producent: {product.producent}</p>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              style={{ marginRight: '10px', width: '60px' }}
            />
            <button onClick={() => addToCart({ ...product, quantity })}>Dodaj do koszyka</button>
            {loggedIn && <button onClick={handleOpenReviewModal}>Napisz opinię</button>}
          </div>
        </div>
        <div className="description-container">
          <div className="description">
            <h3>Opis produktu</h3>
            <p>{product.opis}</p>
          </div>
        </div>
        <div className="reviews-container">
          <h3>Opinie</h3>
          {reviews.map((review, index) => (
            <div key={index} className="review">
              <p>Ocena: {review.ocena}/5</p>
              <div className="review-date">{review.data.split('T')[0]}</div>
              <p>{review.tresc}</p>
            </div>
          ))}
        </div>
        {isReviewModalOpen && (
          <div className="review-modal">
            <div className="review-modal-content">
              <button className="close-button" onClick={handleCloseReviewModal}>&times;</button>
              <h3>Napisz opinię</h3>
              <select value={reviewRating} onChange={handleRatingChange}>
                {[1, 2, 3, 4, 5].map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <textarea
                placeholder="Twoja opinia..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              ></textarea>
              <div>
                <button onClick={handleSubmitReview}>Wyślij</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
