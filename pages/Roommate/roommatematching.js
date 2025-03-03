import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useStateContext } from '@/context/StateContext'
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore'
import { database } from '@/backend/Firebase'
import Navbar from '@/components/Dashboard/Navbar'
import Image from 'next/image'

const RoommateMatching = () => {
  const { user } = useStateContext()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState(null)
  const [potentialMatches, setPotentialMatches] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchesFound, setMatchesFound] = useState(0)
  const [matchList, setMatchList] = useState([])
  const [showMatches, setShowMatches] = useState(false)

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Fetch current user profile
    const fetchUserProfile = async () => {
      try {
        const profileRef = doc(database, 'userProfiles', user.uid)
        const profileSnapshot = await getDoc(profileRef)
        
        if (profileSnapshot.exists()) {
          const profileData = profileSnapshot.data()
          setUserProfile(profileData)
          
          // After getting user profile, fetch potential matches
          await fetchPotentialMatches(profileData)
        } else {
          // If no profile exists, redirect to create profile page
          router.push('/auth/createprofile')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile data. Please try again.')
        setLoading(false)
      }
    }

    const fetchPotentialMatches = async (profileData) => {
      try {
        // Query users from the same university except current user
        const matchesQuery = query(
          collection(database, 'userProfiles'),
          where('university', '==', profileData.university),
        )
        
        const querySnapshot = await getDocs(matchesQuery)
        const matches = []
        
        querySnapshot.forEach((doc) => {
          if (doc.id !== user.uid) { // Exclude current user
            matches.push({
              id: doc.id,
              ...doc.data()
            })
          }
        })
        
        // Shuffle the matches array for randomness
        const shuffledMatches = matches.sort(() => 0.5 - Math.random())
        setPotentialMatches(shuffledMatches)
        setMatchesFound(shuffledMatches.length)
        
        // Fetch existing matches
        await fetchExistingMatches()
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching matches:', err)
        setError('Failed to load potential roommates. Please try again.')
        setLoading(false)
      }
    }
    
    const fetchExistingMatches = async () => {
      try {
        const matchesRef = doc(database, 'roomateMatches', user.uid)
        const matchesSnapshot = await getDoc(matchesRef)
        
        if (matchesSnapshot.exists()) {
          const matchData = matchesSnapshot.data()
          setMatchList(matchData.matches || [])
        }
      } catch (err) {
        console.error('Error fetching existing matches:', err)
      }
    }

    fetchUserProfile()
  }, [user, router])
  
  // Handle like action
  const handleLike = async () => {
    if (currentCardIndex >= potentialMatches.length) return
    
    const likedUserId = potentialMatches[currentCardIndex].id
    
    try {
      // Update current user's matches
      const userMatchesRef = doc(database, 'roomateMatches', user.uid)
      const userMatchesSnapshot = await getDoc(userMatchesRef)
      
      if (userMatchesSnapshot.exists()) {
        await updateDoc(userMatchesRef, {
          likes: arrayUnion(likedUserId)
        })
      } else {
        // Create new document if it doesn't exist
        await updateDoc(userMatchesRef, {
          likes: [likedUserId]
        })
      }
      
      // Check if the other user has liked the current user
      const otherUserMatchesRef = doc(database, 'roomateMatches', likedUserId)
      const otherUserMatchesSnapshot = await getDoc(otherUserMatchesRef)
      
      if (otherUserMatchesSnapshot.exists()) {
        const otherUserData = otherUserMatchesSnapshot.data()
        
        if (otherUserData.likes && otherUserData.likes.includes(user.uid)) {
          // It's a match! Add to both users' matches array
          await updateDoc(userMatchesRef, {
            matches: arrayUnion(likedUserId)
          })
          
          await updateDoc(otherUserMatchesRef, {
            matches: arrayUnion(user.uid)
          })
          
          // Update local match list
          setMatchList([...matchList, likedUserId])
        }
      }
      
      // Move to next card
      setCurrentCardIndex(currentCardIndex + 1)
    } catch (err) {
      console.error('Error updating matches:', err)
      setError('Failed to save your choice. Please try again.')
    }
  }
  
  // Handle dislike action
  const handleDislike = async () => {
    if (currentCardIndex >= potentialMatches.length) return
    
    const dislikedUserId = potentialMatches[currentCardIndex].id
    
    try {
      // Update current user's dislikes
      const userMatchesRef = doc(database, 'roomateMatches', user.uid)
      const userMatchesSnapshot = await getDoc(userMatchesRef)
      
      if (userMatchesSnapshot.exists()) {
        await updateDoc(userMatchesRef, {
          dislikes: arrayUnion(dislikedUserId)
        })
      } else {
        // Create new document if it doesn't exist
        await updateDoc(userMatchesRef, {
          dislikes: [dislikedUserId]
        })
      }
      
      // Move to next card
      setCurrentCardIndex(currentCardIndex + 1)
    } catch (err) {
      console.error('Error updating dislikes:', err)
      setError('Failed to save your choice. Please try again.')
    }
  }
  
  // If user is not authenticated, don't render the page
  if (!user) {
    return null
  }

  return (
    <PageContainer>
      <Navbar />
      <ContentContainer>
        <HeadingContainer>
          <PageTitle>
            Find Your Perfect <AccentText>Roommate</AccentText>
          </PageTitle>
          <PageSubtitle>
            Swipe right for potential roommates at {userProfile?.university}
          </PageSubtitle>
          
          <TabContainer>
            <TabButton 
              active={!showMatches} 
              onClick={() => setShowMatches(false)}
            >
              Discover
            </TabButton>
            <TabButton 
              active={showMatches} 
              onClick={() => setShowMatches(true)}
            >
              My Matches <MatchCount>{matchList.length}</MatchCount>
            </TabButton>
          </TabContainer>
        </HeadingContainer>
        
        {loading ? (
          <LoadingMessage>Finding your potential roommates...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : showMatches ? (
          // Show matches list
          <MatchesContainer>
            {matchList.length > 0 ? (
              matchList.map(matchId => {
                const matchUser = potentialMatches.find(user => user.id === matchId)
                return matchUser ? (
                  <MatchCard key={matchId}>
                    <ProfileImageContainer>
                      {matchUser.profilePicture ? (
                        <ProfileImage 
                          src={matchUser.profilePicture} 
                          alt={`${matchUser.firstName}'s profile`} 
                          width={80} 
                          height={80} 
                        />
                      ) : (
                        <ProfilePlaceholder small>
                          <InitialsCircle small>
                            {matchUser.firstName?.[0]}{matchUser.lastName?.[0]}
                          </InitialsCircle>
                        </ProfilePlaceholder>
                      )}
                    </ProfileImageContainer>
                    <MatchInfo>
                      <MatchName>{matchUser.firstName} {matchUser.lastName}</MatchName>
                      <MatchDetail>{matchUser.age} years old • {matchUser.university}</MatchDetail>
                    </MatchInfo>
                    <MessageButton onClick={() => router.push(`/messages/${matchId}`)}>
                      Message
                    </MessageButton>
                  </MatchCard>
                ) : null
              })
            ) : (
              <NoMatchesMessage>
                You haven't matched with anyone yet. Start swiping to find your roommate!
              </NoMatchesMessage>
            )}
          </MatchesContainer>
        ) : potentialMatches.length > 0 && currentCardIndex < potentialMatches.length ? (
          // Show card stack
          <CardStack>
            <UserCard>
              <CardImageSection>
                {potentialMatches[currentCardIndex].profilePicture ? (
                  <CardImage 
                    src={potentialMatches[currentCardIndex].profilePicture} 
                    alt={`${potentialMatches[currentCardIndex].firstName}'s profile`} 
                    fill
                  />
                ) : (
                  <CardPlaceholder>
                    <InitialsCircle large>
                      {potentialMatches[currentCardIndex].firstName?.[0]}
                      {potentialMatches[currentCardIndex].lastName?.[0]}
                    </InitialsCircle>
                  </CardPlaceholder>
                )}
                <CardGradient />
                <CardName>
                  {potentialMatches[currentCardIndex].firstName} {potentialMatches[currentCardIndex].lastName}, {potentialMatches[currentCardIndex].age}
                </CardName>
              </CardImageSection>
              
              <CardInfoSection>
                <InfoItem>
                  <InfoIconContainer>🏫</InfoIconContainer>
                  <InfoText>{potentialMatches[currentCardIndex].university}</InfoText>
                </InfoItem>
                <InfoItem>
                  <InfoIconContainer>🎂</InfoIconContainer>
                  <InfoText>{new Date(potentialMatches[currentCardIndex].birthday).toLocaleDateString('en-US', {
                    month: 'long', 
                    day: 'numeric'
                  })}</InfoText>
                </InfoItem>
                <CardBio>
                  {potentialMatches[currentCardIndex].bio || "No bio provided"}
                </CardBio>
              </CardInfoSection>
              
              <ActionButtons>
                <DislikeButton onClick={handleDislike}>✕</DislikeButton>
                <LikeButton onClick={handleLike}>♥</LikeButton>
              </ActionButtons>
            </UserCard>
            
            <RemainingCounter>
              {potentialMatches.length - currentCardIndex} potential roommates remaining
            </RemainingCounter>
          </CardStack>
        ) : (
          <NoMoreCards>
            <NoMoreCardsIcon>🏠</NoMoreCardsIcon>
            <NoMoreCardsTitle>No more potential roommates</NoMoreCardsTitle>
            <NoMoreCardsText>We've shown you all available roommates at your university. Check your matches or come back later!</NoMoreCardsText>
            <ViewMatchesButton onClick={() => setShowMatches(true)}>
              View Your Matches
            </ViewMatchesButton>
          </NoMoreCards>
        )}
      </ContentContainer>
    </PageContainer>
  )
}

const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
  min-height: 100vh;
`;

const ContentContainer = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
`;

const HeadingContainer = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const PageTitle = styled.h1`
  font-size: 36px;
  color: white;
  margin-bottom: 12px;
`;

const AccentText = styled.span`
  color: #ff6b6b;
`;

const PageSubtitle = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const TabButton = styled.button`
  background-color: ${props => props.active ? 'rgba(255, 107, 107, 0.2)' : 'transparent'};
  color: ${props => props.active ? '#ff6b6b' : 'white'};
  border: 1px solid ${props => props.active ? '#ff6b6b' : 'rgba(255, 255, 255, 0.2)'};
  padding: 12px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    border-color: #ff6b6b;
    background-color: rgba(255, 107, 107, 0.1);
  }
`;

const MatchCount = styled.span`
  background-color: #ff6b6b;
  color: black;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-left: 8px;
`;

const CardStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const UserCard = styled.div`
  background-color: rgb(32, 31, 31);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  margin-bottom: 24px;
`;

const CardImageSection = styled.div`
  position: relative;
  height: 400px;
  width: 100%;
`;

const CardImage = styled(Image)`
  object-fit: cover;
`;

const CardPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 107, 107, 0.1);
`;

const CardGradient = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
`;

const CardName = styled.h2`
  position: absolute;
  bottom: 16px;
  left: 16px;
  color: white;
  font-size: 28px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const CardInfoSection = styled.div`
  padding: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const InfoIconContainer = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 107, 107, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
`;

const InfoText = styled.p`
  color: white;
  font-size: 16px;
`;

const CardBio = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  margin-top: 20px;
  line-height: 1.5;
  max-height: 150px;
  overflow-y: auto;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 16px 24px 24px;
`;

const ActionButton = styled.button`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const LikeButton = styled(ActionButton)`
  background-color: #ff6b6b;
  color: white;
  
  &:hover {
    background-color: #ff4d4d;
  }
`;

const DislikeButton = styled(ActionButton)`
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const RemainingCounter = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-top: 16px;
`;

const NoMoreCards = styled.div`
  background-color: rgb(32, 31, 31);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
`;

const NoMoreCardsIcon = styled.div`
  font-size: 48px;
  margin-bottom: 24px;
`;

const NoMoreCardsTitle = styled.h2`
  font-size: 24px;
  color: white;
  margin-bottom: 16px;
`;

const NoMoreCardsText = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 32px;
  line-height: 1.5;
`;

const ViewMatchesButton = styled.button`
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

const MatchesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;
`;

const MatchCard = styled.div`
  background-color: rgb(32, 31, 31);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const ProfileImageContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #ff6b6b;
  flex-shrink: 0;
`;

const ProfilePlaceholder = styled.div`
  width: ${props => props.small ? '80px' : '150px'};
  height: ${props => props.small ? '80px' : '150px'};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background-color: rgba(255, 107, 107, 0.1);
  border: ${props => props.small ? '2px' : '3px'} solid #ff6b6b;
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
  font-size: ${props => props.small ? '24px' : props.large ? '60px' : '40px'};
  font-weight: bold;
`;

const ProfileImage = styled(Image)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const MatchInfo = styled.div`
  flex: 1;
  margin-left: 16px;
`;

const MatchName = styled.h3`
  font-size: 20px;
  color: white;
  margin-bottom: 8px;
`;

const MatchDetail = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const MessageButton = styled.button`
  background-color: #ff6b6b;
  color: black;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  
  &:hover {
    color: white;
    transform: translateY(-2px);
  }
`;

const NoMatchesMessage = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 60px 20px;
  font-size: 18px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
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
  margin: 0 auto;
`;

export default RoommateMatching