import React, { useRef, useState, useEffect } from "react";
import "./ExploreMenu.css";
import { menu_list } from "../../assets/assets";
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoRestaurantOutline,
} from "react-icons/io5";

const ExploreMenu = ({ category, setCategory }) => {
  const listRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (listRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleScroll = (direction) => {
    if (listRef.current) {
      const scrollAmount = 300;
      listRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="explore-menu" id="explore-menu">
      <div className="explore-menu-header">
        <h2 className="explore-menu-title">Jelajahi menu kami</h2>
        <p className="explore-menu-text">
          Temukan ragam hidangan lezat pilihan yang siap memanjakan selera dan momen santapmu.
        </p>
      </div>

      <div className="explore-menu-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="menu-scroll-btn scroll-left"
            onClick={() => handleScroll("left")}
            aria-label="Scroll ke kiri"
          >
            <IoChevronBackOutline />
          </button>
        )}

        <div
          className="explore-menu-list"
          ref={listRef}
          onScroll={checkScroll}
        >
          {/* 'Semua' (All) Category Option */}
          <div
            onClick={() => setCategory("All")}
            className="explore-menu-list-item"
          >
            <div
              className={`all-menu-icon ${
                category === "All" ? "active" : ""
              }`}
            >
              <div className="all-menu-icon-inner">
                <IoRestaurantOutline />
              </div>
            </div>
            <p className={category === "All" ? "active-text" : ""}>Semua</p>
          </div>

          {menu_list.map((item, index) => {
            const isSelected = category === item.menu_name;
            return (
              <div
                onClick={() =>
                  setCategory((prev) =>
                    prev === item.menu_name ? "All" : item.menu_name
                  )
                }
                key={index}
                className="explore-menu-list-item"
              >
                <img
                  className={isSelected ? "active" : ""}
                  src={item.menu_image}
                  alt={item.menu_name}
                />
                <p className={isSelected ? "active-text" : ""}>
                  {item.menu_name}
                </p>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="menu-scroll-btn scroll-right"
            onClick={() => handleScroll("right")}
            aria-label="Scroll ke kanan"
          >
            <IoChevronForwardOutline />
          </button>
        )}
      </div>

      <hr className="explore-menu-divider" />
    </section>
  );
};

export default ExploreMenu;