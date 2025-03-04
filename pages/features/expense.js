import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useStateContext } from '@/context/StateContext'
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc, query, where } from 'firebase/firestore'
import { database } from '@/backend/Firebase'
import Navbar from '@/components/Dashboard/Navbar'

const expense = () => {
  const { user } = useStateContext()
  const router = useRouter()
  const [expenses, setExpenses] = useState([])
  const [newExpense, setNewExpense] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newPayer, setNewPayer] = useState('')
  const [newDate, setNewDate] = useState('')
  const [error, setError] = useState('')
  const [roommates, setRoommates] = useState([])
  const [roommateProfiles, setRoommateProfiles] = useState([])

  //all the data above is used to keep track of the expenses and the roommates
  
  useEffect(() => {
    
    const fetchRoommates = async () => { //fetches the roommates
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

   
    const fetchExpenses = async () => { //fetches the expenses
      try {
        await fetchRoommates()
        
        const expensesRef = collection(database, 'sharedExpenses')
        const q = query(expensesRef, where('householdIds', 'array-contains', user.uid))
        const querySnapshot = await getDocs(q)
        
        const expensesData = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first
        
        setExpenses(expensesData)
      } catch (err) {
        console.error('Error fetching expenses:', err)
        setError('Failed to load expenses. Please try again.')
      } 
    }

    fetchExpenses()
  }, [user, router])

  
  const handleAddExpense = async () => { //handles the addition of an expense
    if (!newExpense) {
      setError('Expense description is required')
      return
    }

    if (!newAmount || isNaN(newAmount) || parseFloat(newAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    try { //try to add the expense
      const payerId = newPayer || user.uid

      let payerName = ''
      if (payerId === user.uid) {
        payerName = 'Me'
      } else {
        const payer = roommateProfiles.find(profile => profile.id === payerId)
        payerName = payer ? `${payer.firstName} ${payer.lastName}` : 'Unknown'
      }

      const newExpenseData = { //data for the new expense
        description: newExpense,
        amount: parseFloat(newAmount),
        payerId: payerId,
        payerName: payerName,
        date: newDate || new Date().toISOString().split('T')[0], // Default to today
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        householdIds: roommates, // All roommates in the household
        settled: false // Not settled by default
      }
      
      const docRef = await addDoc(collection(database, 'sharedExpenses'), newExpenseData)
      setExpenses([{ id: docRef.id, ...newExpenseData }, ...expenses])
      
      
      setNewExpense('')
      setNewAmount('')
      setNewPayer('')
      setNewDate('')
      setError('')
    } catch (err) {
      console.error('Error adding expense:', err)
      setError('Failed to add expense. Please try again.')
    }
  }

  
  const toggleExpenseStatus = async (id, currentStatus) => { //toggles the status of the expense
    try {
      await updateDoc(doc(database, 'sharedExpenses', id), {
        settled: !currentStatus
      })
      
      setExpenses(expenses.map(expense => 
        expense.id === id ? { 
          ...expense, 
          settled: !currentStatus
        } : expense
      ))
    } catch (err) {
      console.error('Error updating expense:', err)
      setError('Failed to update expense. Please try again.')
    }
  }

  
  const deleteExpense = async (id) => { //deletes the expense
    try {
      await deleteDoc(doc(database, 'sharedExpenses', id))
      setExpenses(expenses.filter(expense => expense.id !== id))
    } catch (err) {
      console.error('Error deleting expense:', err)
      setError('Failed to delete expense. Please try again.')
    }
  }

  
  const formatDate = (dateString) => {
    if (!dateString) return 'No date'
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  
  const getExpenseTotal = (userId) => {
    if (!userId) return '$0.00'
    
    const total = expenses
      .filter(expense => expense.payerId === userId)
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    return `$${total.toFixed(2)}`
  }

  return (
    <>
      <PageContainer>
        <Navbar />
        <FormContainer>
          <FormCard>
            <FormHeader>Shared <span>Expenses</span></FormHeader>
            <FormSubtitle>Track household expenses with your roommates</FormSubtitle>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <AddExpenseSection>
              <InputGroup>
                <Input
                  type="text"
                  value={newExpense}
                  onChange={(e) => setNewExpense(e.target.value)}
                  placeholder="Enter expense description"
                />
                <AmountInput
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Amount ($)"
                  min="0.01"
                  step="0.01"
                />
                <SelectInput
                  value={newPayer}
                  onChange={(e) => setNewPayer(e.target.value)} 
                >
                  <option value="">Paid by me</option>
                  {roommateProfiles.map(roommate => ( //iterates through the roommates and adds them to the dropdown
                    <option key={roommate.id} value={roommate.id}>
                      {roommate.firstName} {roommate.lastName}  
                    </option>
                  ))} 
                </SelectInput>
                <DateInput
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <AddButton onClick={handleAddExpense}>Add Expense</AddButton>
              </InputGroup>
            </AddExpenseSection>
            
            <ExpensesContainer>
              {expenses.length === 0 ? (
                <EmptyState>
                  <EmptyStateText>No expenses found</EmptyStateText>
                  <EmptyStateSubtext>
                    Add your first expense using the form above
                  </EmptyStateSubtext>
                </EmptyState>
              ) : (
                <ExpensesList>
                  {expenses.map((expense) => (
                    <ExpenseItem key={expense.id} settled={expense.settled}>
                      <ExpenseCheckbox 
                        checked={expense.settled}
                        onChange={() => toggleExpenseStatus(expense.id, expense.settled)} //toggles the status of the expense
                      />
                  
                      <ExpenseDetails> 
                        <ExpenseDescription settled={expense.settled}>
                          {expense.description} 
                        </ExpenseDescription> 
                        <ExpenseAmount settled={expense.settled}> 
                          ${expense.amount.toFixed(2)} 
                        </ExpenseAmount>
                        <ExpenseMetadata>
                          <ExpensePayer>
                            Paid by: {expense.payerId === user?.uid ? 'Me' : expense.payerName}
                          </ExpensePayer>
                          {expense.date && 
                            <ExpenseDate>
                              Date: {formatDate(expense.date)}
                            </ExpenseDate>
                          }
                        </ExpenseMetadata>
                      </ExpenseDetails>
                      <DeleteButton onClick={() => deleteExpense(expense.id)}>
                        X
                      </DeleteButton>
                    </ExpenseItem>
                  ))}
                </ExpensesList>
              )}
            </ExpensesContainer>

            <RoommateStatusSection>
              <SectionTitle>Household Expenses</SectionTitle>
              <RoommatesList>
                {roommateProfiles.length > 0 ? (
                  roommateProfiles.map(roommate => (
                    <RoommateItem key={roommate.id}>
                      <RoommateAvatar>
                        {roommate.firstName?.[0]}{roommate.lastName?.[0]}
                      </RoommateAvatar>
                      <RoommateName>{roommate.firstName} {roommate.lastName}</RoommateName>
                      <RoommateExpenseTotal>Total paid: {getExpenseTotal(roommate.id)}</RoommateExpenseTotal>
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
                  <RoommateExpenseTotal>Total paid: {getExpenseTotal(user?.uid)}</RoommateExpenseTotal>
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
  align-items: center;
  padding: 38px 20px 40px 20px;
  flex: 1;
`;

const FormCard = styled.div`
  background-color: rgb(32, 31, 31);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 8px 16px black;
`;

const FormHeader = styled.h1`
  font-size: 36px;
  color: white;
  margin-bottom: 16px;
  text-align: center;
  
  span {
    color: #3ecf8e;
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

const AddExpenseSection = styled.div`
  display: flex;
  flex-direction: column;
    gap: 16px;
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
    border-color: #3ecf8e;
  }
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const AmountInput = styled(Input)`
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
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
    border-color: #3ecf8e;
  }
  
  option {
    background-color: #1a1a1a;
  }
`;

const DateInput = styled(Input)`
  color-scheme: dark;
`;

const AddButton = styled.button`
  background-color: #3ecf8e;
  color: black;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  
  &:hover {
    color: white;
  }
`;

const ExpensesContainer = styled.div`
  min-height: 300px;
  margin-bottom: 30px;
`;

const ExpensesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ExpenseItem = styled.li`
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
  opacity: 1
`;

const ExpenseCheckbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  margin-right: 16px;
  cursor: pointer;
`;

const ExpenseDetails = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
`;

const ExpenseDescription = styled.p`
  font-size: 18px;
  color: white;
  margin: 0 0 8px 0;
  text-decoration: ${props => props.settled ? 'line-through' : 'none'};
  flex: 2;
  min-width: 200px;
`;

const ExpenseAmount = styled.p`
  font-size: 18px;
  color: #3ecf8e;
  margin: 0 0 2px 0;
  text-decoration: ${props => props.settled ? 'line-through' : 'none'};
  text-align: right;
  flex: 1;
  min-width: 100px;
`;

const ExpenseMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
`;

const ExpensePayer = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const ExpenseDate = styled.span`
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
  background-color: rgba(62, 207, 142, 0.2);
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

const RoommateExpenseTotal = styled.p`
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

export default expense;