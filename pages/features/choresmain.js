import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useStateContext } from '@/context/StateContext'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, query, where } from 'firebase/firestore'
import { database } from '@/backend/Firebase'
import Navbar from '@/components/Dashboard/Navbar'

const Chores = () => {
  const { user } = useStateContext()
  const router = useRouter()
  const [chores, setChores] = useState([])
  const [newChore, setNewChore] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [error, setError] = useState('')
  const [roommates, setRoommates] = useState([])
  const [roommateProfiles, setRoommateProfiles] = useState([])

  //all of the above data is being fetched from the database
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    const fetchRoommates = async () => { // fetches the roommates
      try {
        const roommateMatchesRef = doc(database, 'roomateMatches', user.uid)
        const matchesSnapshot = await getDoc(roommateMatchesRef)
        
        if (matchesSnapshot.exists()) {
          const matchData = matchesSnapshot.data()
          const roommates = matchData.roommates || []
          setRoommates([user.uid, ...roommates]) 

        
          const profiles = []
          for (const roommateId of roommates) {
            const profileRef = doc(database, 'userProfiles', roommateId)
            const profileSnapshot = await getDoc(profileRef)
            if (profileSnapshot.exists()) {
              profiles.push({
                id: roommateId,
                ...profileSnapshot.data()
              })
            }
          }
          setRoommateProfiles(profiles)
        } else {
          setRoommates([user.uid])
        }
      } catch (err) {
        console.error('Error fetching roommates:', err)
        setError('Failed to load roommates. Please try again.')
      }
    }

   
    const fetchChores = async () => { // fetches the chores
      try {
        await fetchRoommates()
        
        const choresRef = collection(database, 'sharedChores')
        const q = query(choresRef, where('householdIds', 'array-contains', user.uid))
        const querySnapshot = await getDocs(q)
        
        const choresData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        
        setChores(choresData)
      } catch (err) {
        console.error('Error fetching chores:', err)
        setError('Failed to load chores. Please try again.')
      } 
    }

    fetchChores()
  }, [user, router])

  
  const handleAddChore = async () => { // adds a chore
    if (!newChore) {
      setError('Chore description is required')
      return
    }

    try {
      const assigneeId = newAssignee || user.uid

     
      let assigneeName = ''
      if (assigneeId === user.uid) {
        assigneeName = 'Me'
      } else {
        const assignee = roommateProfiles.find(profile => profile.id === assigneeId)
        assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unknown'
      }

      const newChoreData = { // data for the new chore
        description: newChore,
        assigneeId: assigneeId,
        assigneeName: assigneeName,
        dueDate: newDueDate,
        completed: false,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        householdIds: roommates
      }
      
      const docRef = await addDoc(collection(database, 'sharedChores'), newChoreData)
      setChores([...chores, { id: docRef.id, ...newChoreData }])
      
      
      setNewChore('')
      setNewAssignee('')
      setNewDueDate('')
      setError('')
    } catch (err) {
      console.error('Error adding chore:', err)
      setError('Failed to add chore. Please try again.')
    }
  }

  
  const toggleChoreStatus = async (id, currentStatus) => { // toggles the status of the chore
    try {
      await updateDoc(doc(database, 'sharedChores', id), {
        completed: !currentStatus
      })
      
      setChores(chores.map(chore => 
        chore.id === id ? { 
          ...chore, 
          completed: !currentStatus
        } : chore
      ))
    } catch (err) {
      console.error('Error updating chore:', err)
      setError('Failed to update chore. Please try again.')
    }
  }

  
  const deleteChore = async (id) => { // deletes the chore
    try {
      await deleteDoc(doc(database, 'sharedChores', id))
      setChores(chores.filter(chore => chore.id !== id))
    } catch (err) {
      console.error('Error deleting chore:', err)
      setError('Failed to delete chore. Please try again.')
    }
  }

  
  const formatDate = (dateString) => { // formats the date
    if (!dateString) return 'No due date'
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  
  const getChoreCount = (userId) => {
    if (!userId) return '0 chores'
    
    const assignedChores = chores.filter(chore => chore.assigneeId === userId).length
    return `${assignedChores} chore${assignedChores !== 1 ? 's' : ''}` // pluralize the word 'chore'
  }

  return (
    <>
      <PageContainer>
        <Navbar />
        <FormContainer>
          <FormCard>
            <FormHeader>Shared <span>Chores</span></FormHeader>
            <FormSubtitle>Manage household chores with your roommates</FormSubtitle>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <AddChoreSection>
              <InputGroup>
                <Input
                  type="text"
                  value={newChore}
                  onChange={(e) => setNewChore(e.target.value)}
                  placeholder="Enter chore description"
                />
                <SelectInput
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                >
                  <option value="">Assign to me</option>
                  {roommateProfiles.map(roommate => (
                    <option key={roommate.id} value={roommate.id}>
                      {roommate.firstName} {roommate.lastName}
                    </option>
                  ))}
                </SelectInput>
                <DateInput
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
                <AddButton onClick={handleAddChore}>Add Chore</AddButton>
              </InputGroup>
            </AddChoreSection>
            
            <ChoresContainer>
              {chores.length === 0 ? (
                <EmptyState>
                  <EmptyStateText>No chores found</EmptyStateText>
                  <EmptyStateSubtext>
                    Add your first chore using the form above
                  </EmptyStateSubtext>
                </EmptyState>
              ) : (
                <ChoresList>
                  {chores.map((chore) => (
                    <ChoreItem key={chore.id} completed={chore.completed}>
                      <ChoreCheckbox 
                        checked={chore.completed}
                        onChange={() => toggleChoreStatus(chore.id, chore.completed)}
                      />
                      <ChoreDetails>
                        <ChoreDescription completed={chore.completed}>
                          {chore.description}
                        </ChoreDescription>
                        <ChoreMetadata>
                          <ChoreAssignee>
                          Assigned to: {chore.assigneeId === user?.uid ? 'Me' : chore.assigneeName}
                          </ChoreAssignee>
                          {chore.dueDate && 
                            <ChoreDueDate>
                              Due: {formatDate(chore.dueDate)}
                            </ChoreDueDate>
                          }
                        </ChoreMetadata>
                      </ChoreDetails>
                      <DeleteButton onClick={() => deleteChore(chore.id)}>
                        X
                      </DeleteButton>
                    </ChoreItem>
                  ))}
                </ChoresList>
              )}
            </ChoresContainer>

            <RoommateStatusSection>
              <SectionTitle>Household Members</SectionTitle>
              <RoommatesList>
                {roommateProfiles.length > 0 ? (
                  roommateProfiles.map(roommate => (
                    <RoommateItem key={roommate.id}>
                      <RoommateAvatar>
                        {roommate.firstName?.[0]}{roommate.lastName?.[0]}
                      </RoommateAvatar>
                      <RoommateName>{roommate.firstName} {roommate.lastName}</RoommateName>
                      <RoommateChoreCount>{getChoreCount(roommate.id)}</RoommateChoreCount>
                    </RoommateItem>
                  ))
                ) : (
                  <EmptyRoommateMessage>
                    No roommates yet. Match with others in the Roommate finder!
                  </EmptyRoommateMessage>
                )}
                <RoommateItem>
                  <RoommateAvatar>
                    ME
                  </RoommateAvatar>
                  <RoommateName>Me</RoommateName>
                  <RoommateChoreCount>{getChoreCount(user?.uid)}</RoommateChoreCount>
                </RoommateItem>
              </RoommatesList>
            </RoommateStatusSection>
          </FormCard>
        </FormContainer>
      </PageContainer>
    </>
  )
}

const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const FormContainer = styled.section`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 38px 20px 40px 20px;
  flex: 1;
`;

const FormCard = styled.div`
  background-color: rgb(32, 31, 31);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 800px;
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

const ErrorMessage = styled.div`
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 14px;
`;

const AddChoreSection = styled.div`
  margin-bottom: 32px;
`;

const InputGroup = styled.div`
  display: grid;
  
  gap: 15px;
  
  
`;

const Input = styled.input`
  font-size: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  
  &:focus {
    border-color: #ff6b6b;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const SelectInput = styled.select`
  font-size: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  
  &:focus {
    border-color: #ff6b6b;
  }
  
  option {
    background-color: #1a1a1a;
  }
`;

const DateInput = styled(Input)`
  color-scheme: dark;
`;

const AddButton = styled.button`
  background-color: #ff6b6b;
  color: black;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  
  &:hover {
    color: white;
  }
`;

const ChoresContainer = styled.div`
  min-height: 300px;
  margin-bottom: 30px;
`;

const ChoresList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ChoreItem = styled.li`
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
`;

const ChoreCheckbox = styled.input.attrs({ type: 'checkbox' })` // checkbox for the chores
  width: 20px;
  height: 20px;
  margin-right: 16px;
  cursor: pointer;
`;

const ChoreDetails = styled.div`
  flex: 1;
`;

const ChoreDescription = styled.p`
  font-size: 18px;
  color: white;
  margin: 0 0 8px 0;
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
`;

const ChoreMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const ChoreAssignee = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const ChoreDueDate = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 107, 107, 0.3);
    color: white;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
`;

const EmptyStateText = styled.p`
  font-size: 20px;
  color: white;
  margin: 0 0 8px 0;
`;

const EmptyStateSubtext = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
`;

const RoommateStatusSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: white;
  margin-bottom: 16px;
`;

const RoommatesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const RoommateItem = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RoommateAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 107, 107, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  margin-bottom: 8px;
`;

const RoommateName = styled.p`
  font-size: 16px;
  color: white;
  margin: 0 0 8px 0;
  text-align: center;
`;

const RoommateChoreCount = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin: 0;
`;

const EmptyRoommateMessage = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 20px;
`;

export default Chores;