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
      <RoomieLife href="/">Roomie<span>Life</span></RoomieLife>
      </LeftSide>
      <NavLinks>
        {user ? (
          <>
          <ButtonLink href="/auth/profile">Profile</ButtonLink>
          <ButtonLink href="/dashboard">Dashboard</ButtonLink>
          <ButtonLink href="/Roommate/roommatematching">Roommate Matching</ButtonLink>
          <ButtonLink href='/chores/choresmain'>Chores</ButtonLink>
          <ButtonLink href="/about">About</ButtonLink>
          <ButtonLinkasButton onClick={handleLogout}>Logout</ButtonLinkasButton>
          </>
        ) : (
          <>
          <ButtonLink href="/auth/signup">Sign Up</ButtonLink>
          <ButtonLink href="/auth/login">Login</ButtonLink>
          <ButtonLink href="/about">About</ButtonLink>
          </>
        )}
        
        
        
        
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
  color: white;
  span {
    color:rgb(32, 31, 31);;
  }
  `
  

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem 1rem 2rem;
  background-color: rgb(255, 107, 107);
  color: white;
  font-family: 'Gill Sans MT';
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);;
  


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
color: white;
background-color: rgb(32, 31, 31);
padding: 10px 10px;
border-radius: 5px;
text-decoration: none;

&:hover {
  transition: .3s ;
  background-color: #F5F7FA;
  color: #ff6b6b;
  font-weight: bold
}
`;
const ButtonLinkasButton = styled.button`
color: white;
background-color: rgb(32, 31, 31);
padding: 10px 10px;
border-radius: 5px;
border-style: none;
text-decoration: none;
font-family: 'Gill Sans MT';

&:hover {
  transition: .3s;
  background-color: #F5F7FA;
  color: #ff6b6b;
  font-weight: bold
}
`;

export default Navbar;
