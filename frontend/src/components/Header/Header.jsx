/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { BsArrowLeftCircleFill, BsArrowRightCircleFill } from "react-icons/bs";
import { useSwipeable } from "react-swipeable"; // Import useSwipeable
import "./Header.css";
import { promoImages } from "../../assets/assets";

export const Header = () => {
  const [slide, setSlide] = useState(0);

  const nextSlide = () => {
    setSlide(slide === promoImages.length - 1 ? 0 : slide + 1);
  };

  const prevSlide = () => {
    setSlide(slide === 0 ? promoImages.length - 1 : slide - 1);
  };

  // Handlers for swipe actions
  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextSlide,
    onSwipedRight: prevSlide,
    preventDefaultTouchmoveEvent: true, // Prevent browser default touch actions
    trackMouse: true, // Enable mouse swiping for testing
  });

  return (
    <div className="carousel" {...swipeHandlers}>
      <BsArrowLeftCircleFill onClick={prevSlide} className="arrow arrow-left" />
      {promoImages.map((item, idx) => {
        return (
          <img
            src={item.src}
            alt={item.alt}
            key={idx}
            className={slide === idx ? "slide" : "slide slide-hidden"}
          />
        );
      })}
      <BsArrowRightCircleFill
        onClick={nextSlide}
        className="arrow arrow-right"
      />
      <span className="indicators">
        {promoImages.map((_, idx) => {
          return (
            <button
              key={idx}
              className={
                slide === idx ? "indicator" : "indicator indicator-inactive"
              }
              onClick={() => setSlide(idx)}
            ></button>
          );
        })}
      </span>
    </div>
  );
};

export default Header;
