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
  const [error, setError] = useState('')
  const [matchList, setMatchList] = useState([])
  const [roommateList, setRoommateList] = useState([])
  const [pendingRoommateRequests, setPendingRoommateRequests] = useState([])
  const [processedUsers, setProcessedUsers] = useState([])

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
      }
    }

    const fetchPotentialMatches = async (profileData) => { //fetches potential matches
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
        
        await fetchExistingMatchesAndRoommates(matches)
      } catch (err) {
        console.error('Error fetching matches:', err)
        setError('Failed to load potential roommates. Please try again.')
      }
    }
    
    const fetchExistingMatchesAndRoommates = async (matches) => { //fetches existing matches and roommates
      try {
        const matchesRef = doc(database, 'roomateMatches', user.uid)
        const matchesSnapshot = await getDoc(matchesRef)
        
        let processedUserIds = []
        let matchedUsers = []
        let roommateUsers = []
        let pendingRequests = []
        
        if (matchesSnapshot.exists()) {
          const matchData = matchesSnapshot.data()
          matchedUsers = matchData.matches || []
          roommateUsers = matchData.roommates || []
          pendingRequests = matchData.pendingRoommateRequests || []
          
          if (matchData.likes) processedUserIds = [...processedUserIds, ...matchData.likes] //if user likes someone
          if (matchData.dislikes) processedUserIds = [...processedUserIds, ...matchData.dislikes] //if user dislikes someone
        }
        
        setMatchList(matchedUsers)
        setRoommateList(roommateUsers)
        setPendingRoommateRequests(pendingRequests)
        setProcessedUsers([...processedUserIds, ...roommateUsers])
        
        const filteredMatches = matches.filter(match =>  //filters matches and roommates based on user id
          !processedUserIds.includes(match.id) && 
          !roommateUsers.includes(match.id)
        )
        
        setPotentialMatches(filteredMatches)
        if (filteredMatches.length > 0) {
          setCurrentMatch(filteredMatches[0])
        } else {
          setCurrentMatch(null)
        }
      } catch (err) {
        console.error('Error fetching existing matches and roommates:', err)
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
      
      if (userMatchesSnapshot.exists()) {
        await updateDoc(userMatchesRef, { //updates the user matches
          likes: arrayUnion(likedUserId)
        })
      } else {
        await setDoc(userMatchesRef, { //sets the user matches if it doesn't exist
          likes: [likedUserId],
          dislikes: [],
          matches: [],
          roommates: [],
          pendingRoommateRequests: []
        })
      }
      
      const otherUserMatchesRef = doc(database, 'roomateMatches', likedUserId)
      const otherUserMatchesSnapshot = await getDoc(otherUserMatchesRef)
      
      if (otherUserMatchesSnapshot.exists()) {
        const otherUserData = otherUserMatchesSnapshot.data()
        
        if (otherUserData.likes && otherUserData.likes.includes(user.uid)) {
          await updateDoc(userMatchesRef, {
            matches: arrayUnion(likedUserId) //updates the user matches to the array of the liked user id
          })
          
          await updateDoc(otherUserMatchesRef, {
            matches: arrayUnion(user.uid) //updates the other user matches
          })
          
          setMatchList(prevMatches => [...prevMatches, likedUserId])
          alert("You have a new match!")
        }
      }
      
      setProcessedUsers(prev => [...prev, likedUserId])
      moveToNextMatch()
    } catch (err) {
      console.error('Error updating matches:', err)
      setError('Failed to save your choice. Please try again.')
    }
  }
  
  const handleRequestRoommate = async (matchId) => {
    try {
      const userMatchesRef = doc(database, 'roomateMatches', user.uid)
      const userMatchesSnapshot = await getDoc(userMatchesRef)
  
      if (userMatchesSnapshot.exists()) {
        await updateDoc(userMatchesRef, {
          pendingRoommateRequests: arrayUnion(matchId)
        })
      } else {
        await setDoc(userMatchesRef, {
          likes: [],
          dislikes: [],
          matches: [],
          roommates: [],
          pendingRoommateRequests: [matchId]
        })
      }
      
      setPendingRoommateRequests(prev => [...prev, matchId])
      alert("Roommate request sent! Waiting for their confirmation.")
    } catch (err) {
      console.error('Error sending roommate request:', err)
      setError('Failed to send roommate request. Please try again.')
    }
  }
  
  const handleConfirmRoommate = async (matchId) => { //handles the confirm roommate button
    try {
      const matchUserRef = doc(database, 'roomateMatches', matchId)
      const matchUserSnapshot = await getDoc(matchUserRef)
      
      if (!matchUserSnapshot.exists()) {
        setError("Could not find the other user's data.")
        return
      }
      
      const matchUserData = matchUserSnapshot.data()
      const theyRequestedUs = matchUserData.pendingRoommateRequests && 
                              matchUserData.pendingRoommateRequests.includes(user.uid)
      
      if (!theyRequestedUs) {
        handleRequestRoommate(matchId)
        return
      }
      
      
     
      const userMatchesRef = doc(database, 'roomateMatches', user.uid)
      await updateDoc(userMatchesRef, {
        matches: arrayRemove(matchId),  //remove the match id from the array
        pendingRoommateRequests: arrayRemove(matchId),
        roommates: arrayUnion(matchId) 
      })
      
      
      await updateDoc(matchUserRef, {
        matches: arrayRemove(user.uid),
        pendingRoommateRequests: arrayRemove(user.uid),
        roommates: arrayUnion(user.uid)
      })
      
     
      setMatchList(prevMatches => prevMatches.filter(id => id !== matchId))
      setPendingRoommateRequests(prev => prev.filter(id => id !== matchId))
      setRoommateList(prevRoommates => [...prevRoommates, matchId])
      
      alert("You are now roommates!")
    } catch (err) {
      console.error('Error confirming roommate:', err)
      setError('Failed to confirm roommate. Please try again.')
    }
  }

    
const ProfileFetchRenderer = ({ matchId, render }) => { //fetches the profile
  const [profile, setProfile] = useState(null)
  
  useEffect(() => {
    const fetchProfile = async () => { //fetches the profile
      try {
        const profileRef = doc(database, 'userProfiles', matchId)
        const profileSnapshot = await getDoc(profileRef)
        
        if (profileSnapshot.exists()) {
          setProfile({
            id: matchId,
            ...profileSnapshot.data()
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }
    
    fetchProfile()
  }, [matchId])
  
  return render(profile)
}

  const handleDislike = async () => { //handles the dislike button
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
        await setDoc(userMatchesRef, {
          likes: [],
          dislikes: [dislikedUserId],
          matches: [],
          roommates: [],
          pendingRoommateRequests: []
        })
      }
      
      setProcessedUsers(prev => [...prev, dislikedUserId])
      moveToNextMatch()
    } catch (err) {
      console.error('Error updating dislikes:', err)
      setError('Failed to save your choice. Please try again.')
    }
  }

  const moveToNextMatch = () => {
    const updatedPotentialMatches = potentialMatches.filter(
      match => match.id !== currentMatch.id
    )
    
    setPotentialMatches(updatedPotentialMatches)
    
    if (updatedPotentialMatches.length > 0) {
      setCurrentMatch(updatedPotentialMatches[0])
    } else {
      setCurrentMatch(null)
    }
  }
  
  
  if (!user) {
    return null
  }

  return (
    <PageContainer>
      <Navbar />
      <ContentContainer>
        <PageTitle>Find Your Roommate at {userProfile?.university}</PageTitle>
        {error && <ErrorMessage>{error}</ErrorMessage>}
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

          <SidebarSection>
            <RoommatesSection>
              <SectionTitle>My Roommates ({roommateList.length})</SectionTitle>
              {roommateList.length > 0 ? (
                <RoommatesList>
                  {roommateList.map(roommateId => ( //for each roommate, display their profile information
                    <RoommateItemWrapper key={roommateId}>
                      <RoommateListItem>
                        <ProfileFetchRenderer
                          matchId={roommateId}
                          render={(roommate) => (
                            <>
                              {roommate?.profilePicture ? (
                                <SmallProfileImage 
                                  src={roommate.profilePicture} 
                                  alt={`${roommate.firstName}'s profile`} 
                                  width={50} 
                                  height={50} 
                                />
                              ) : (
                                <SmallProfilePlaceholder>
                                  {roommate?.firstName?.[0]}{roommate?.lastName?.[0]}
                                </SmallProfilePlaceholder>
                              )}
                              <MatchName>{roommate?.firstName} {roommate?.lastName}</MatchName>
                            </>
                          )}
                        />
                      </RoommateListItem>
                    </RoommateItemWrapper>
                  ))}
                </RoommatesList>
              ) : (
                <NoRoommates>
                  You haven't confirmed any roommates yet. Make someone a roommate from your matches!
                </NoRoommates>
              )}
            </RoommatesSection>
            <MatchesSection>
              <SectionTitle>My Matches ({matchList.length})</SectionTitle>
              {matchList.length > 0 ? (
                <MatchesList>
                  {matchList.map(matchId => (
                    <MatchItemWrapper key={matchId}>
                      <MatchListItem>
                        <ProfileFetchRenderer
                          matchId={matchId}
                          render={(match) => (
                            <>
                              {match?.profilePicture ? ( //if the user has a profile picture, display it
                                <SmallProfileImage 
                                  src={match.profilePicture} 
                                  alt={`${match.firstName}'s profile`} 
                                  width={50} 
                                  height={50} 
                                />
                              ) : (
                                <SmallProfilePlaceholder>
                                  {match?.firstName?.[0]}{match?.lastName?.[0]}
                                </SmallProfilePlaceholder>
                              )}
                              <MatchName>{match?.firstName} {match?.lastName}</MatchName>
                            </>
                          )}
                        />
                        <RoommateButton 
                          isPending={pendingRoommateRequests.includes(matchId)}
                          onClick={() => handleConfirmRoommate(matchId)}
                        >
                          {pendingRoommateRequests.includes(matchId) 
                            ? "Pending Request" 
                            : "Request Roommate"}
                        </RoommateButton>
                      </MatchListItem>
                    </MatchItemWrapper>
                  ))}
                </MatchesList>
              ) : (
                <NoMatches>
                  You haven't matched with anyone yet. Start by showing interest in potential roommates!
                </NoMatches>
              )}
            </MatchesSection>
          </SidebarSection>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  )
}


const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
  min-height: 100vh;
`;

const ContentContainer = styled.div`
  max-width: 1500px;
  margin:auto;
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
  flex-direction: column;
  
 
`;

const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  

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
  background-color: rgb(32, 31, 31);
  padding: 20px;
  border-radius: 10px;
  height: fit-content;
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

const RoommateButton = styled(Button)`
  background-color: #ff6b6b;
  color: black;
  padding: 8px 12px;
  font-size: 14px;
  opacity: 1;
  cursor: pointer;
  
  &:hover {
    color: white;
    background-color:#ff4d4d;
  }
`;

const MatchesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MatchItemWrapper = styled.div``;

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

const ErrorMessage = styled.div`
  background-color: rgba(255, 0, 0, 0.1);
  color: #ff6b6b;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

const NoMatches = styled.p`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 20px 10px;
  font-size: 16px;
  background-color: #1a1a1a;
  border-radius: 8px;
`;

const NoRoommates = styled.p`
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

const RoommateItemWrapper = styled.div``;

const RoommateListItem = styled.div`
  display: flex;
  align-items: center;
  background-color: #1a1a1a;
  padding: 10px;
  border-radius: 8px;
`;

const RoommatesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RoommatesSection = styled.div`
  background-color: rgb(32, 31, 31);
  padding: 20px;
  border-radius: 10px;
  height: fit-content;
`;

export default SimpleRoommateMatching