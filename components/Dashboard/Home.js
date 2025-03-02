import React from 'react';
import Link  from 'next/link';
import { IoMdHome } from 'react-icons/io'; // Importing a home icon from react-icons
import styled from 'styled-components';

const Home = () => {
  return (
    <Square href="/dashboard">
      <IoMdHome />
    </Square>
  );
};

const Square = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px; // Adjust the size as needed
  height: 50px; // Adjust the size as needed
  background-color: #ff6b6b; // Adjust the background color as needed
  color: white;
  border-radius: 4px; // Adjust for square or rounded corners
  text-decoration: none;
  font-family: 'Gill Sans MT';
  transition: background-color .3s ease-in-out;
  
  svg {
    width: 24px; // Adjust icon size as needed
    height: 24px; // Adjust icon size as needed
  }

  &:hover {
    background-color:#F5F7FA; // Adjust hover effect as needed
    color: #ff6b6b; // Adjust hover effect as needed
  }
`;

export default Home;
