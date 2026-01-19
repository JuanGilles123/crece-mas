import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/loading.json';
import './LottieLoader.css';

const LottieLoader = ({ 
  size = 'medium', 
  message = 'Cargando...', 
  showMessage = true,
  className = '' 
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'lottie-small';
      case 'large': return 'lottie-large';
      default: return 'lottie-medium';
    }
  };

  return (
    <div className={`lottie-loader ${getSizeClass()} ${className}`}>
      <Lottie 
        animationData={loadingAnimation}
        loop={true}
        autoplay={true}
        className="lottie-animation"
      />
      {showMessage && (
        <p className="lottie-message">{message}</p>
      )}
    </div>
  );
};

export default LottieLoader;
