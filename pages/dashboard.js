import React from 'react'
import { styled } from 'styled-components'
import Navbar from "@/components/Dashboard/Navbar"
import Link from 'next/link'


export default function Dashboard() {
  
  return (
    <>
      <PageContainer>
        <Navbar />
        <DashboardHeader>
          <WelcomeTitle>Welcome to <span>RoomieLife</span></WelcomeTitle>
          <WelcomeSubtitle>Manage your roommate experience all in one place</WelcomeSubtitle>
        </DashboardHeader>

        <DashboardContent>
          <DashboardCards>
            <DashboardCard>
              <CardIcon>👤</CardIcon>
              <CardTitle>Profile</CardTitle>
              <CardDescription>View and edit your personal information</CardDescription>
              <CardButton href="/auth/profile">Manage Profile</CardButton>
            </DashboardCard>

            <DashboardCard>
              <CardIcon>✔️</CardIcon>
              <CardTitle>Chores</CardTitle>
              <CardDescription>Track and manage household responsibilities</CardDescription>
              <CardButton href="/chores/choresmain">Manage Chores</CardButton>
            </DashboardCard>

            <DashboardCard>
              <CardIcon>💰</CardIcon>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Track shared expenses and payments</CardDescription>
              <CardButton href="/expense.js">Manage Expenses</CardButton>
            </DashboardCard>
          </DashboardCards>

          <DashboardSummary>
            <SummaryTitle>Quick Summary</SummaryTitle>
            <SummaryBox>
              <SummaryItem>
                <SummaryLabel>Upcoming Chores</SummaryLabel>
                <SummaryValue>3</SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Pending Expenses</SummaryLabel>
                <SummaryValue>$45</SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Roommates</SummaryLabel>
                <SummaryValue>2</SummaryValue>
              </SummaryItem>
            </SummaryBox>
          </DashboardSummary>
        </DashboardContent>
      </PageContainer>
    </>
  )
}

const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
  min-height: 100vh;
  color: white;
`;

const DashboardHeader = styled.div`
  padding: 30px 20px;
  text-align: center;
`;

const WelcomeTitle = styled.h1`
  font-size: 36px;
  color: white;
  margin-bottom: 10px;
  
  span {
    color: #ff6b6b;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 18px;
  color: grey;
`;

const DashboardContent = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const DashboardCards = styled.div`
  display: grid;
  gap: 30px;
  grid-template-columns: 1fr;
  margin-bottom: 40px;
  
`;

const DashboardCard = styled.div`
  background-color: rgb(32, 31, 31);
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-10px);
  }
`;

const CardIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
`;

const CardTitle = styled.h2`
  font-size: 24px;
  color: white;
  margin-bottom: 10px;
`;

const CardDescription = styled.p`
  font-size: 16px;
  color: grey;
  margin-bottom: 20px;
`;

const CardButton = styled(Link)`
  background-color: #ff6b6b;
  color: black;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  text-decoration: none;
  margin-top: auto;
  
  &:hover {
    font-weight: bold;
  }
`;

const DashboardSummary = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 16px;
`;

const SummaryTitle = styled.h2`
  font-size: 24px;
  color: #ff6b6b;
  margin-bottom: 20px;
`;

const SummaryBox = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
  
`;

const SummaryItem = styled.div`
  background-color: rgb(32, 31, 31);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
`;

const SummaryLabel = styled.p`
  font-size: 16px;
  color: grey;
  margin-bottom: 10px;
`;

const SummaryValue = styled.p`
  font-size: 24px;
  color: white;
  font-weight: bold;
`;