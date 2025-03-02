import React from 'react';
import styled from 'styled-components';
import Link from 'next/link'
import { logOut } from '@/backend/Auth';
import { useStateContext } from '@/context/StateContext';
import Home from '@/components/Dashboard/Home'
const Navbar = () => {
  const { user, setUser } = useStateContext()

  const handleLogout = async() => {
    await logOut(setUser);
    
  };

  return (
    
    <Nav>
      <LeftSide>
        <Home></Home>
      <RoomieLife href="/">RoomieLife</RoomieLife>
      </LeftSide>
      <NavLinks>
        {user ? (
          <>
          <ButtonLink href="/dashboard">Dashboard</ButtonLink>
          <ButtonLink href='/chores/choresmain'>Chores</ButtonLink>
          <ButtonLinkasButton onClick={handleLogout}>Logout</ButtonLinkasButton>
          </>
        ) : (
          <>
          <ButtonLink href="/auth/signup">Sign Up</ButtonLink>
          <ButtonLink href="/auth/login">Login</ButtonLink>
          </>
        )}
        
        <ButtonLink href="/about">About</ButtonLink>
        
        
      </NavLinks>
    </Nav>
  );
};

const LeftSide = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  `
const RoomieLife = styled(Link)`
  font-size: 20px;
  font-weight: bold;
  text-decoration: none;
  color: black;
  `
  

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem 1rem 2rem;
  background-color: #F5F7FA;
  color: white;
  font-family: 'Gill Sans MT';
  


`;

const Logo = styled(Link)`
color: white;
  

`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: 'Gill Sans MT';
  color: black;

`;

const ButtonLink = styled(Link)`
color: black;
background-color: #ff6b6b;
padding: 0.5rem 1rem;
border-radius: 4px;
transition: background-color .3s ease-in-out;
text-decoration: none;

&:hover {
  background-color: #F5F7FA;
  color: #ff6b6b;
  font-weight: bold
}
`;
const ButtonLinkasButton = styled.button`
color: black;
background-color: #ff6b6b;
padding: 0.5rem 1rem;
border-radius: 4px;
transition: background-color .3s ease-in-out;
text-decoration: none;
font-family: 'Gill Sans MT';

&:hover {
  background-color: #F5F7FA;
  color: #ff6b6b;
  font-weight: bold
}
`;

export default Navbar;
