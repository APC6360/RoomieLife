import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useStateContext } from '@/context/StateContext'
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore'
import { database } from '@/backend/Firebase'
import Navbar from '@/components/Dashboard/Navbar'
import Image from 'next/image'

const SimpleRoommateMatching = () => {
  const { user } = useStateContext()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState(null)
  const [potentialMatches, setPotentialMatches] = useState([])
  const [currentMatch, setCurrentMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [matchList, setMatchList] = useState([])
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    const fetchUserProfile = async () => { //fetches the user profile
      try {
        const profileRef = doc(database, 'userProfiles', user.uid)
        const profileSnapshot = await getDoc(profileRef)
        
        if (profileSnapshot.exists()) {
          const profileData = profileSnapshot.data()
          setUserProfile(profileData)
          await fetchPotentialMatches(profileData)
        } else {
          router.push('/auth/createprofile')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile data. Please try again.')
        setLoading(false)
      }
    }

    const fetchPotentialMatches = async (profileData) => { //fetches the potential matches
      try {
        const matchesQuery = query(
          collection(database, 'userProfiles'),
          where('university', '==', profileData.university),
        )
        const querySnapshot = await getDocs(matchesQuery)
        const matches = []
        
        querySnapshot.forEach((doc) => {
          if (doc.id !== user.uid) { 
            matches.push({
              id: doc.id,
              ...doc.data()
            })
          }
        })
        setPotentialMatches(matches)
        if (matches.length > 0) {
          setCurrentMatch(matches[0])
        }
        await fetchExistingMatches()
        
        setLoading(false)
      } catch (err) {
        console.error('Error fetching matches:', err)
        setError('Failed to load potential roommates. Please try again.')
        setLoading(false)
      }
    }
    
    const fetchExistingMatches = async () => { //fetches the existing matches
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
  
  const handleLike = async () => { //handles the like button
    if (!currentMatch) return
    
    const likedUserId = currentMatch.id
    
    try {
      const userMatchesRef = doc(database, 'roomateMatches', user.uid)
      const userMatchesSnapshot = await getDoc(userMatchesRef)
      
      if (userMatchesSnapshot.exists()) { //if the user exists
        await updateDoc(userMatchesRef, {
          likes: arrayUnion(likedUserId) //add the liked user to the likes array
        })
      } else {
        await setDoc(userMatchesRef, { //create a new document
          likes: [likedUserId], //add the liked user to the likes array
          dislikes: [],
          matches: []
        })
      }
      
      const otherUserMatchesRef = doc(database, 'roomateMatches', likedUserId) //get the other user's matches
      const otherUserMatchesSnapshot = await getDoc(otherUserMatchesRef) //get the other user's matches
      
      if (otherUserMatchesSnapshot.exists()) {
        const otherUserData = otherUserMatchesSnapshot.data()
        
        if (otherUserData.likes && otherUserData.likes.includes(user.uid)) { //if users like each other
          //match
          await updateDoc(userMatchesRef, {
            matches: arrayUnion(likedUserId)
          })
          
          await updateDoc(otherUserMatchesRef, {
            matches: arrayUnion(user.uid)
          })
          
          // add match to list
          setMatchList(prevMatches => [...prevMatches, likedUserId])
          alert("You have a new match!")
        }
      }
      
      // move to next match
      moveToNextMatch()
    } catch (err) {
      console.error('Error updating matches:', err)
      setError('Failed to save your choice. Please try again.')
    }
  }
  
  const handleMakeRoommate = async (matchId) => { //handles the make roommate button
    try {
      const userMatchesRef = doc(database, 'roomateMatches', user.uid)
      const userMatchesSnapshot = await getDoc(userMatchesRef)

      if (userMatchesSnapshot.exists()) {
        await updateDoc(userMatchesRef, {
          matches: arrayUnion(matchId),
          roommates: arrayUnion(matchId)
        })
      } else {
        await setDoc(userMatchesRef, {
          likes: [],
          dislikes: [],
          matches: [matchId],
          roommates: [matchId]
        })
      }
    }
    catch (err) {
      console.error('Error updating roommate:', err)
      setError('Failed to save your choice. Please try again.')
    }

  }
  const handleDislike = async () => {
    if (!currentMatch) return
    
    const dislikedUserId = currentMatch.id
    
    try {
      
      const userMatchesRef = doc(database, 'roomateMatches', user.uid)
      const userMatchesSnapshot = await getDoc(userMatchesRef)
      
      if (userMatchesSnapshot.exists()) {
        
        await updateDoc(userMatchesRef, {
          dislikes: arrayUnion(dislikedUserId)
        })
      } else {
        // create new document
        await setDoc(userMatchesRef, {
          likes: [],
          dislikes: [dislikedUserId],
          matches: []
        })
      }
      
      // move to next match
      moveToNextMatch()
    } catch (err) {
      console.error('Error updating dislikes:', err)
      setError('Failed to save your choice. Please try again.')
    }
  }

  const moveToNextMatch = () => {
    // current match index
    const currentIndex = potentialMatches.findIndex(match => match.id === currentMatch.id)
    
    // move to next match
    if (currentIndex < potentialMatches.length - 1) {
      setCurrentMatch(potentialMatches[currentIndex + 1])
    } else {
      // No more matches
      setCurrentMatch(null)
    }
  }
  
  const getMatchProfile = (matchId) => {
    return potentialMatches.find(match => match.id === matchId)
  }
  
  // If user is not authenticated, don't render the page
  if (!user) {
    return null
  }

  return (
    <PageContainer>
      <Navbar />
      <ContentContainer>
        <PageTitle>Find Your Roommate at {userProfile?.university}</PageTitle>
        {loading ? (
          <LoadingMessage>Loading potential roommates...</LoadingMessage>
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : (
          <MainContent>
            <MatchingSection>
              <SectionTitle>Potential Roommates</SectionTitle>
              {currentMatch ? ( 
                <PotentialMatchCard> 
                  <ProfileSection> 
                    {currentMatch.profilePicture ? (
                      <ProfileImage 
                        src={currentMatch.profilePicture} 
                        alt={`${currentMatch.firstName}'s profile`} 
                        width={120} 
                        height={120} 
                      />
                    ) : ( 
                      <ProfilePlaceholder>
                        {currentMatch.firstName?.[0]}{currentMatch.lastName?.[0]}
                      </ProfilePlaceholder>
                    )}
                    <ProfileName>{currentMatch.firstName} {currentMatch.lastName}</ProfileName>
                    <ProfileDetail>Age: {currentMatch.age}</ProfileDetail>
                  </ProfileSection>
                  
                  <DetailSection>
                    <DetailItem>
                      <DetailLabel>University:</DetailLabel>
                      <DetailValue>{currentMatch.university}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Bio:</DetailLabel>
                      <DetailValue>{currentMatch.bio || "No bio provided"}</DetailValue>
                    </DetailItem>
                    
                    {currentMatch.lifestylePreferences && (
                      <>
                        <DetailItem>
                          <DetailLabel>Smoking:</DetailLabel>
                          <DetailValue>{currentMatch.lifestylePreferences.smoking || "Not specified"}</DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Pets:</DetailLabel>
                          <DetailValue>{currentMatch.lifestylePreferences.pets || "Not specified"}</DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Noise Level:</DetailLabel>
                          <DetailValue>{currentMatch.lifestylePreferences.noise || "Not specified"}</DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Cleanliness:</DetailLabel>
                          <DetailValue>{currentMatch.lifestylePreferences.cleanliness || "Not specified"}</DetailValue>
                        </DetailItem>
                      </>
                    )}
                  </DetailSection>
                  <ButtonContainer>
                    <DislikeButton onClick={handleDislike}>Not Interested</DislikeButton>
                    <LikeButton onClick={handleLike}>Interested</LikeButton>
                  </ButtonContainer>
                </PotentialMatchCard>
              ) : (
                <NoMoreMatches>
                  No more potential roommates available. Check back later!
                </NoMoreMatches>
              )}
            </MatchingSection>

            <MatchesSection>
              <SectionTitle>My Matches ({matchList.length})</SectionTitle>
              {matchList.length > 0 ? (
                <MatchesList>
                  {matchList.map(matchId => {
                    const match = getMatchProfile(matchId)
                    if (!match) return null
                    
                    return (
                      <MatchListItem key={matchId}>
                        {match.profilePicture ? (
                          <SmallProfileImage 
                            src={match.profilePicture} 
                            alt={`${match.firstName}'s profile`} 
                            width={50} 
                            height={50} 
                          />
                        ) : (
                          <SmallProfilePlaceholder>
                            {match.firstName?.[0]}{match.lastName?.[0]}
                          </SmallProfilePlaceholder>
                        )}
                        <MatchName>{match.firstName} {match.lastName}</MatchName>
                        <TempButton onClick={handleMakeRoommate(matchId)}>
                          temp
                        </TempButton>
                      </MatchListItem>
                    )
                  })}
                </MatchesList>
              ) : (
                <NoMatches>
                  You haven't matched with anyone yet. Start by showing interest in potential roommates!
                </NoMatches>
              )}
            </MatchesSection>
          </MainContent>
        )}
      </ContentContainer>
    </PageContainer>
  )
}

// Styled Components
const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  color: white;
  text-align: center;
  margin-bottom: 30px;
`;

const MainContent = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  color: #ff6b6b;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 107, 107, 0.3);
`;

const MatchingSection = styled.div`
  flex: 1;
  background-color: rgb(32, 31, 31);
  padding: 20px;
  border-radius: 10px;
`;

const MatchesSection = styled.div`
  width: 350px;
  background-color: rgb(32, 31, 31);
  padding: 20px;
  border-radius: 10px;
  height: fit-content;
  
  @media (max-width: 900px) {
    width: 100%;
  }
`;

const PotentialMatchCard = styled.div`
  background-color: #1a1a1a;
  border-radius: 10px;
  padding: 20px;
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

const ProfileImage = styled(Image)`
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ff6b6b;
`;

const ProfilePlaceholder = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: rgba(255, 107, 107, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  color: white;
  border: 3px solid #ff6b6b;
`;

const SmallProfileImage = styled(Image)`
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ff6b6b;
`;

const SmallProfilePlaceholder = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(255, 107, 107, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: white;
  border: 2px solid #ff6b6b;
`;

const ProfileName = styled.h3`
  font-size: 24px;
  color: white;
  margin-top: 15px;
  margin-bottom: 5px;
`;

const ProfileDetail = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
`;

const DetailSection = styled.div`
  margin-bottom: 20px;
`;

const DetailItem = styled.div`
  margin-bottom: 10px;
`;

const DetailLabel = styled.span`
  font-size: 16px;
  color: #ff6b6b;
  margin-right: 10px;
`;

const DetailValue = styled.span`
  font-size: 16px;
  color: white;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
`;

const Button = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
`;

const LikeButton = styled(Button)`
  background-color: #ff6b6b;
  color: black;
  
  &:hover {
    background-color: #ff4d4d;
    color: white;
  }
`;

const DislikeButton = styled(Button)`
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const MatchesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MatchListItem = styled.div`
  display: flex;
  align-items: center;
  background-color: #1a1a1a;
  padding: 10px;
  border-radius: 8px;
`;

const MatchName = styled.p`
  flex: 1;
  margin-left: 10px;
  color: white;
  font-size: 16px;
`;

const TempButton = styled.button`
  background-color: #ff6b6b;
  color: black;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    color: white;
  }
`;

const NoMatches = styled.p`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 20px 10px;
  font-size: 16px;
  background-color: #1a1a1a;
  border-radius: 8px;
`;

const NoMoreMatches = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 40px 20px;
  font-size: 18px;
  background-color: #1a1a1a;
  border-radius: 8px;
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
  max-width: 600px;
  margin: 0 auto;
`;

export default SimpleRoommateMatching