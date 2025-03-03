import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/router'
import { useStateContext } from '@/context/StateContext'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { database, storage } from '@/backend/Firebase'
import Navbar from '@/components/Dashboard/Navbar'

const CreateProfile = () => {
  const { user } = useStateContext()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [university, setUniversity] = useState('')
  const [bio, setBio] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const handlePictureChange = (e) => {
    const file = e.target.files[0]
    if (!file.type.match('image.*')) {
      setError('Only image files are allowed.')
      return
    }
    setProfilePicture(file)
    const fileReader = new FileReader()
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result)
    }
    fileReader.readAsDataURL(file)
  }

  const handleSelectPicture = () => {
    fileInputRef.current.click()
  }

  const validateForm = () => {
    if (!firstName || !lastName || !birthday || !university) {
      setError('Please fill in all fields')
      return false
    }
    setError('')
    return true
  }

  const calculateAge = (birthdate) => {
    const today = new Date()
    const birthDate = new Date(birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleSubmitProfile = async () => {
    if (!user || !user.uid) {
      setError('You need to be logged in')
      router.push('/auth/login')
      return
    }

    if (!validateForm()) return

    setLoading(true)

    try {
      let profileImageUrl = ''
      if (profilePicture) {
        const storageRef = ref(storage, `profile_pictures/${user.uid}`)
        await uploadBytes(storageRef, profilePicture)
        profileImageUrl = await getDownloadURL(storageRef)
      }

      const userProfileData = {
        firstName,
        lastName,
        birthday,
        age: calculateAge(birthday),
        university,
        bio,
        profilePicture: profileImageUrl,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        email: user.email
      }

      await setDoc(doc(database, 'userProfiles', user.uid), userProfileData)
      router.push('/dashboard')
    } catch (err) {
      console.error('Error:', err)
      setError('Error creating profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <PageContainer>
      <Navbar />
      <FormContainer>
        <FormCard>
          <FormHeader>Complete Your <span>Profile</span></FormHeader>
          <FormSubtitle>Tell us a bit about yourself</FormSubtitle>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <ProfilePictureSection>
            <ProfilePictureContainer onClick={handleSelectPicture}>
              {previewUrl ? (
                <ProfileImage src={previewUrl} alt="Profile preview" />
              ) : (
                <ProfilePlaceholder>
                  <span>Add Picture</span>
                </ProfilePlaceholder>
              )}
            </ProfilePictureContainer>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePictureChange}
            />
          </ProfilePictureSection>

          <FormGroup>
            <InputTitle>First Name</InputTitle>
            <Input 
              type="text" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </FormGroup>

          <FormGroup>
            <InputTitle>Last Name</InputTitle>
            <Input 
              type="text" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
            />
          </FormGroup>

          <FormGroup>
            <InputTitle>Birthday</InputTitle>
            <Input 
              type="date" 
              value={birthday} 
              onChange={(e) => setBirthday(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <InputTitle>University</InputTitle>
            <Input 
              type="text" 
              value={university} 
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Enter your university"
            />
          </FormGroup>

          <FormGroup>
            <InputTitle>Bio</InputTitle>
            <TextArea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </FormGroup>

          <SubmitButton 
            onClick={handleSubmitProfile}
            disabled={loading}
          >
            {loading ? 'Creating Profile...' : 'Complete Profile'}
          </SubmitButton>
        </FormCard>
      </FormContainer>
    </PageContainer>
  )
}

const ProfileImage = ({ src, alt }) => (
  <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
)

const PageContainer = styled.div`
  background-color: #121212;
  font-family: 'Gill Sans MT';
  min-height: 100vh;
`;

const FormContainer = styled.section`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 38px 20px 40px 20px;
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

const ProfilePictureSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

const ProfilePictureContainer = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed rgba(255, 107, 107, 0.5);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #ff6b6b;
  }
`;

const ProfilePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  font-size: 14px;
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

const TextArea = styled.textarea`
  font-size: 16px;
  padding: 12px 16px;
  width: 100%;
  border-radius: 8px;
  border: .37px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  resize: vertical;
  font-family: inherit;
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

const SubmitButton = styled.button`
  background-color: #ff6b6b;
  color: black;
  padding: 16px 32px;
  border-radius: 8px;
  border: none;
  width: 100%;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    color: white;
    font-weight: bold;
    transform: translateY(-4px);
  }
  
  &:disabled {
    background-color: #7d3535;
    cursor: not-allowed;
    transform: none;
    color: rgba(255, 255, 255, 0.5);
  }
`;

export default CreateProfile
