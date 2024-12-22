// Home.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import './Home.css';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
import { StoreContext } from '../../context/StoreContext'; // Import StoreContext

const Home = () => {
  const { setTableNumber } = useContext(StoreContext); // Get setTableNumber from context
  const [category, setCategory] = useState("All");
  const location = useLocation();

  useEffect(() => {
    // Extract the table number from the URL query parameters
    const params = new URLSearchParams(location.search);
    const table = params.get('table');
    if (table) {
      setTableNumber(table); // Set the table number in the context
    }
  }, [location.search, setTableNumber]);

  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category} />
    </div>
  );
};

export default Home;