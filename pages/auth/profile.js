import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useStateContext } from '@/context/StateContext'
import { doc, getDoc } from 'firebase/firestore'
import { database } from '@/backend/Firebase'
import Navbar from '@/components/Dashboard/Navbar'
import Image from 'next/image'

const Profile = () => {
  const { user } = useStateContext()
  const router = useRouter()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Fetch user profile data from Firestore
    const fetchProfileData = async () => {
      try {
        const profileRef = doc(database, 'userProfiles', user.uid)
        const profileSnapshot = await getDoc(profileRef)
        
        if (profileSnapshot.exists()) {
          setProfileData(profileSnapshot.data())
        } else {
          // If no profile exists, redirect to create profile page
          router.push('/auth/createprofile')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [user, router])

  // If user is not authenticated, don't render the page
  if (!user) {
    return null
  }

  return (
    <PageContainer>
      <Navbar />
      <ProfileContainer>
        {loading ? (
          <LoadingMessage>Loading profile...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : profileData ? (
          <ProfileCard>
            <ProfileHeader>
              My Profile
            </ProfileHeader>
            
            <ProfileContent>
              <ProfileImageSection>
                {profileData.profilePicture ? (
                  <ProfileImageContainer>
                    <ProfileImage 
                      src={profileData.profilePicture} 
                      alt={`${profileData.firstName}'s profile`} 
                      width={150} 
                      height={150} 
                    />
                  </ProfileImageContainer>
                ) : (
                  <ProfilePlaceholder>
                    <InitialsCircle>
                      {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                    </InitialsCircle>
                  </ProfilePlaceholder>
                )}
              </ProfileImageSection>
              
              <ProfileName>
                {profileData.firstName} {profileData.lastName}
              </ProfileName>
              
              <ProfileInfoSection>
                <InfoRow>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue>{profileData.email}</InfoValue>
                </InfoRow>
                
                <InfoRow>
                  <InfoLabel>Age</InfoLabel>
                  <InfoValue>{profileData.age} years old</InfoValue>
                </InfoRow>
                
                <InfoRow>
                  <InfoLabel>Birthday</InfoLabel>
                  <InfoValue>{new Date(profileData.birthday).toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}</InfoValue>
                </InfoRow>
                
                <InfoRow>
                  <InfoLabel>University</InfoLabel>
                  <InfoValue>{profileData.university}</InfoValue>
                </InfoRow>
                
                <InfoRow fullWidth>
                  <InfoLabel>Bio</InfoLabel>
                  <BiographyText>{profileData.bio || "No bio provided"}</BiographyText>
                </InfoRow>
              </ProfileInfoSection>
              
              {/* Lifestyle Preferences Section */}
              <LifestyleSection>
                <SectionTitle>Lifestyle Preferences</SectionTitle>
                
                <PreferencesGrid>
                  <PreferenceCard>
                    <PreferenceIcon>🚬</PreferenceIcon>
                    <PreferenceTitle>Smoking</PreferenceTitle>
                    <PreferenceValue>
                      {profileData.lifestylePreferences?.smoking || "Not specified"}
                    </PreferenceValue>
                  </PreferenceCard>
                  
                  <PreferenceCard>
                    <PreferenceIcon>🐾</PreferenceIcon>
                    <PreferenceTitle>Pets</PreferenceTitle>
                    <PreferenceValue>
                      {profileData.lifestylePreferences?.pets || "Not specified"}
                    </PreferenceValue>
                  </PreferenceCard>
                  
                  <PreferenceCard>
                    <PreferenceIcon>🔊</PreferenceIcon>
                    <PreferenceTitle>Noise Level</PreferenceTitle>
                    <PreferenceValue>
                      {profileData.lifestylePreferences?.noise || "Not specified"}
                    </PreferenceValue>
                  </PreferenceCard>
                  
                  <PreferenceCard>
                    <PreferenceIcon>🧹</PreferenceIcon>
                    <PreferenceTitle>Cleanliness</PreferenceTitle>
                    <PreferenceValue>
                      {profileData.lifestylePreferences?.cleanliness || "Not specified"}
                    </PreferenceValue>
                  </PreferenceCard>
                </PreferencesGrid>
              </LifestyleSection>
              
              <ButtonsContainer>
                <EditButton onClick={() => router.push('/auth/editprofile')}>
                  Edit Profile
                </EditButton>
                <BackButton onClick={() => router.push('/dashboard')}>
                  Back to Dashboard
                </BackButton>
              </ButtonsContainer>
            </ProfileContent>
          </ProfileCard>
        ) : null}
      </ProfileContainer>
    </PageContainer>
  )
}

const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
  min-height: 100vh;
`;

const ProfileContainer = styled.section`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 38px 20px 40px 20px;
`;

const ProfileCard = styled.div`
  background-color: rgb(32, 31, 31);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 700px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
`;

const ProfileHeader = styled.h1`
  font-size: 36px;
  color: white;
  margin-bottom: 32px;
  text-align: center;
  
  span {
    color: #ff6b6b;
  }
`;

const ProfileContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ProfileImageSection = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
`;

const ProfileImageContainer = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #ff6b6b;
`;

const ProfilePlaceholder = styled.div`
  width: 150px;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background-color: rgba(255, 107, 107, 0.1);
  border: 3px solid #ff6b6b;
`;

const InitialsCircle = styled.div`
  width: 90%;
  height: 90%;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 107, 107, 0.3);
  color: white;
  font-size: 40px;
  font-weight: bold;
`;

const ProfileImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProfileName = styled.h2`
  font-size: 28px;
  color: white;
  margin-bottom: 32px;
  text-align: center;
`;

const ProfileInfoSection = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 32px;
`;

const InfoRow = styled.div`
  width: ${props => props.fullWidth ? '100%' : '50%'};
  margin-bottom: 24px;
  padding: 0 12px;
`;

const InfoLabel = styled.p`
  font-size: 14px;
  color: #ff6b6b;
  margin-bottom: 8px;
`;

const InfoValue = styled.p`
  font-size: 18px;
  color: white;
  word-break: break-word;
`;

const BiographyText = styled.p`
  font-size: 16px;
  color: white;
  line-height: 1.6;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
  min-height: 100px;
`;

const LifestyleSection = styled.div`
  width: 100%;
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 22px;
  color: white;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 107, 107, 0.3);
  width: 100%;
`;

const PreferencesGrid = styled.div`
  display: grid;
  
  gap: 20px;
  width: 100%;
`;

const PreferenceCard = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.1);
  }
`;

const PreferenceIcon = styled.div`
  font-size: 28px;
  margin-bottom: 12px;
`;
const PreferenceTitle = styled.h4`
  font-size: 16px;
  color: #ff6b6b;
  margin-bottom: 8px;
  text-align: center;
`;
const PreferenceValue = styled.p`
  font-size: 14px;
  color: white;
  text-align: center;
  line-height: 1.4;
`;

const LoadingMessage = styled.div`
  color: white;
  font-size: 18px;
  text-align: center;
  padding: 40px;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  font-size: 16px;
  text-align: center;
  max-width: 500px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  width: 100%;
`;

const EditButton = styled.button`
  background-color: #ff6b6b;
  color: black;
  padding: 14px 28px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  
  &:hover {
    color: white;
    font-weight: bold;
    transform: translateY(-4px);
  }
`;

const BackButton = styled.button`
  background-color: transparent;
  color: white;
  padding: 14px 28px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  
  &:hover {
    border-color: white;
    transform: translateY(-4px);
  }
`;

export default Profile