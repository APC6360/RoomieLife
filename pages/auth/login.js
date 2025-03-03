import React, { useState } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useStateContext } from '@/context/StateContext'
import {login, isEmailInUse} from '@/backend/Auth'
import Link from 'next/link'
import Navbar from '@/components/Dashboard/Navbar'
const Login = () => {
  const { user, setUser } = useStateContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin() {
    try {
      await login(email, password, setUser);
      router.push('/dashboard');
    } catch (err) {
      console.log('Error Logging In', err);
      setError('Invalid email or password');
    }
  }

  return (
    <>
      <PageContainer>
        <Navbar />
        <FormContainer>
          <FormCard>
            <FormHeader>Welcome Back to Roomie<span>Life</span></FormHeader>
            <FormSubtitle>Sign in to your account</FormSubtitle>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <FormGroup>
              <InputTitle htmlFor="email">Email</InputTitle>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </FormGroup>
            <FormGroup>
              <InputTitle htmlFor="password">Password</InputTitle>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </FormGroup>
            <SignupButton onClick={handleLogin}>Login</SignupButton>
            <LoginSubtitle>
              Don't have an account? <LoginLink href="/auth/signup">Sign Up</LoginLink>
            </LoginSubtitle>
          </FormCard>
        </FormContainer>
      </PageContainer>
    </>
  );
};

const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
  height: 100vh;
`;

const FormContainer = styled.section`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 38px 20px 20px 20px;
`;

const FormCard = styled.div`
  background-color: rgb(32, 31, 31);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
`;

const FormHeader = styled.h1`
  font-size: 36px;
  color: white;
  margin-bottom: 16px;
  text-align: center;
  
  span {
    color: #ff6b6b;
  }
`;

const FormSubtitle = styled.p`
  font-size: 18px;
  color: grey;
  margin-bottom: 32px;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const InputTitle = styled.label`
  font-size: 16px;
  color: white;
  display: block;
  margin-bottom: 8px;
`;

const Input = styled.input`
  font-size: 16px;
  padding: 12px 16px;
  width: 100%;
  border-radius: 8px;
  border: .37px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  &:focus {
    transition: 0.2s;
    outline: none;
    border-color: #ff6b6b;
    box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
  }
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 14px;
`;

const SignupButton = styled.button`
  background-color: #ff6b6b;
  color: black;
  padding: 16px 32px;
  border-radius: 8px;
  border: none;
  width: 100%;
  cursor: pointer;
  margin-bottom: 16px;
  &:hover {
    color: white;
    font-weight: bold;
    transform: translateY(-4px);
  }
`;

const LoginSubtitle = styled.p`
  font-size: 16px;
  color: grey;
  text-align: center;
`;

const LoginLink = styled(Link)`
  color: #ff6b6b;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export default Login;
