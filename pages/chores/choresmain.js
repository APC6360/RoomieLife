import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useStateContext } from '@/context/StateContext'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { database } from '@/backend/Firebase'
import Navbar from '@/components/Dashboard/Navbar'

const Chores = () => {
  const { user } = useStateContext()
  const router = useRouter()
  const [chores, setChores] = useState([])
  const [newChore, setNewChore] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Fetch user's chores from Firestore
    const fetchChores = async () => {
      try {
        const choresRef = collection(database, 'userChores')
        const querySnapshot = await getDocs(choresRef)
        const choresData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(chore => chore.userId === user.uid)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        
        setChores(choresData)
      } catch (err) {
        console.error('Error fetching chores:', err)
        setError('Failed to load chores. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchChores()
  }, [user, router])

  // Add a new chore
  const handleAddChore = async () => {
    if (!newChore) {
      setError('Chore description is required')
      return
    }

    try {
      const newChoreData = {
        description: newChore,
        assignee: newAssignee,
        dueDate: newDueDate,
        completed: false,
        createdAt: new Date().toISOString(),
        userId: user.uid
      }
      
      const docRef = await addDoc(collection(database, 'userChores'), newChoreData)
      setChores([...chores, { id: docRef.id, ...newChoreData }])
      
      // Reset form fields
      setNewChore('')
      setNewAssignee('')
      setNewDueDate('')
      setError('')
    } catch (err) {
      console.error('Error adding chore:', err)
      setError('Failed to add chore. Please try again.')
    }
  }

  // Toggle chore completion status
  const toggleChoreStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(database, 'userChores', id), {
        completed: !currentStatus
      })
      
      setChores(chores.map(chore => 
        chore.id === id ? { ...chore, completed: !currentStatus } : chore
      ))
    } catch (err) {
      console.error('Error updating chore:', err)
      setError('Failed to update chore. Please try again.')
    }
  }

  // Delete a chore
  const deleteChore = async (id) => {
    try {
      await deleteDoc(doc(database, 'userChores', id))
      setChores(chores.filter(chore => chore.id !== id))
    } catch (err) {
      console.error('Error deleting chore:', err)
      setError('Failed to delete chore. Please try again.')
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <>
      <PageContainer>
        <Navbar />
        <FormContainer>
          <FormCard>
            <FormHeader>Chores <span>Manager</span></FormHeader>
            <FormSubtitle>Organize and track your household chores</FormSubtitle>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <AddChoreSection>
              <InputGroup>
                <Input
                  type="text"
                  value={newChore}
                  onChange={(e) => setNewChore(e.target.value)}
                  placeholder="Enter chore description"
                />
                <Input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="Assigned to"
                />
                <DateInput
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
                <AddButton onClick={handleAddChore}>Add Chore</AddButton>
              </InputGroup>
            </AddChoreSection>
            
            <ChoresContainer>
              {loading ? (
                <LoadingMessage>Loading chores...</LoadingMessage>
              ) : chores.length === 0 ? (
                <EmptyState>
                  <EmptyStateText>No chores added yet</EmptyStateText>
                  <EmptyStateSubtext>Add your first chore using the form above</EmptyStateSubtext>
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
                          {chore.assignee && <ChoreAssignee>Assigned to: {chore.assignee}</ChoreAssignee>}
                          {chore.dueDate && 
                            <ChoreDueDate overdue={new Date(chore.dueDate) < new Date() && !chore.completed}>
                              Due: {formatDate(chore.dueDate)}
                            </ChoreDueDate>
                          }
                        </ChoreMetadata>
                      </ChoreDetails>
                      <DeleteButton onClick={() => deleteChore(chore.id)}>
                        ✕
                      </DeleteButton>
                    </ChoreItem>
                  ))}
                </ChoresList>
              )}
            </ChoresContainer>
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
  grid-template-columns: 3fr 2fr 1fr 1fr;
  gap: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  font-size: 16px;
  padding: 12px 16px;
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
  transition: all 0.3s ease;
  
  &:hover {
    color: white;
    font-weight: bold;
    transform: translateY(-2px);
  }
`;

const ChoresContainer = styled.div`
  min-height: 300px;
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
  background-color: ${props => props.completed ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'};
  margin-bottom: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.completed ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const ChoreCheckbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  margin-right: 16px;
  cursor: pointer;
  accent-color: #ff6b6b;
`;

const ChoreDetails = styled.div`
  flex: 1;
`;

const ChoreDescription = styled.p`
  font-size: 18px;
  color: white;
  margin: 0 0 8px 0;
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  opacity: ${props => props.completed ? 0.7 : 1};
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
  color: ${props => props.overdue ? '#ff6b6b' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: ${props => props.overdue ? 'bold' : 'normal'};
`;

const DeleteButton = styled.button`
  background-color: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 16px;
  
  &:hover {
    background-color: rgba(255, 107, 107, 0.3);
    color: white;
  }
`;

const LoadingMessage = styled.div`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 40px 0;
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

export default Chores;