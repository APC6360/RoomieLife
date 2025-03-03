import React from 'react'
import { styled } from 'styled-components'
import Navbar from "@/components/Dashboard/Navbar"
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
    
    <PageContainer>
    <Navbar/>
      <HeaderTitle>Roomie<span>Life</span></HeaderTitle>
      <HeaderSection1>
        <Header1Content>
        <HeaderSection1Title>
          Find roommates, and <span>simplify</span> living
        </HeaderSection1Title>
        <HeaderSection1Subtitle>
          Find roommates and simplify living all in one place.
        </HeaderSection1Subtitle>
        <HeaderSection1Button>
          <SignupButton href="/auth/signup">Sign Up</SignupButton>
          
          </HeaderSection1Button>
          <Loginsubtitle>Already have an account? <LoginLink href="/auth/login">Login</LoginLink></Loginsubtitle>

          </Header1Content>
          <Header1Image>
            <ImageRoommate src="/photos/Roommates.jpeg" alt="roommates" width={500} height={500}>
            </ImageRoommate>
          </Header1Image>
      </HeaderSection1>
      <Features>
        <FeatureTitle>Everything you need for  <span>an amazing living experience!</span></FeatureTitle>
        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>🗣️</FeatureIcon>
            <FeatureTitle>Find Roommates</FeatureTitle>
            <FeatureDescription>Find roommates to live with!</FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>✔</FeatureIcon>
            <FeatureTitle>Manage Chores</FeatureTitle>
            <FeatureDescription>Manage chores with your roommates!</FeatureDescription>
          </FeatureCard>
          <FeatureCard>
            <FeatureIcon>$</FeatureIcon>
            <FeatureTitle>Manage Expenses</FeatureTitle>
            <FeatureDescription>Manage expenses with your roommates!</FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </Features>
    </PageContainer>
        
        
    </>
  )
}

const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
`;

const HeaderTitle = styled.h1`
  font-size: 48px;
  color: white;
  text-align: center;
  padding: 20px 10px 5px 10px;
  span {
    color: #ff6b6b;
  }
`;
const HeaderSection1 = styled.div`
  display: flex;
  flex-direction: column;
  gap: 50px;
  padding: 50px 20px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
`;
const Header1Content = styled.div`
  flex: 1;
`;
const HeaderSection1Title = styled.h1`
  font-size: 45px;
  color: white;
  span {
    color: #ff6b6b;
  }
`;
const HeaderSection1Subtitle = styled.p`
  font-size: 20px;
  color: grey;
  margin-top: 16px;
  margin-bottom: 32px;

`;
const HeaderSection1Button = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const SignupButton = styled(Link)`
  background-color: #ff6b6b;
  color: black;
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 18px;
  text-decoration: none;

  &:hover {
    background-color: #ff6b6b;
    color: black;
    font-weight: bold;
  }
`;
const Loginsubtitle = styled.p`
  font-size: 16px;
  color: grey;
  margin-top: 16px;
  `;
const LoginLink = styled(Link)`
  color: #ff6b6b;
  text-decoration: none;
  `;
const Header1Image = styled.div`
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
  margin: 0 auto;

`;
const ImageRoommate = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
`;

const Features = styled.div`
  background-color: rgba(255, 255, 255, 0.1);

  text-allign: center;
  padding: 50px 20px;
  `;

const FeatureTitle = styled.h2`
  font-size: 24px;
  color: #ff6b6b;
  margin-bottom: 32px;
  span {
    color: white;
    
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  gap: 32px;
  grid-template-columns: 1fr;
`;

const FeatureCard = styled.div`
  color: white;
  background-color: rgb(32, 31, 31);
  padding: 22px;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-10px);
    transition: transform 0.2s ease-in-out;
  }
`;

const FeatureIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const FeatureDescription = styled.p`
  font-size: 16px;
  color: grey;
`;


