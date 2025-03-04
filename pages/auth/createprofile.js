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
  const [universitySearch, setUniversitySearch] = useState('')
  const [universities, setUniversities] = useState([])
  const [filteredUniversities, setFilteredUniversities] = useState([])
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false)
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false)
  const [bio, setBio] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const universityInputRef = useRef(null)
  const dropdownRef = useRef(null)
  const [smokingPreference, setSmokingPreference] = useState('')
  const [petsPreference, setPetsPreference] = useState('')
  const [noisePreference, setNoisePreference] = useState('')
  const [cleanlinessPreference, setCleanlinessPreference] = useState('')
  const smokingOptions = [
    "I don't smoke and prefer non-smokers",
    "I don't smoke but don't mind smokers",
    "I smoke occasionally",
    "I smoke regularly"
  ]
  const petsOptions = [
    "I don't have pets and prefer no pets",
    "I don't have pets but don't mind them",
    "I have pets and they will live with me",
    "I have pets but they won't live with me"
  ]
  const noiseOptions = [
    "I prefer a quiet living environment",
    "I don't mind occasional noise",
    "I'm often noisy (music, guests, etc.)",
    "I'm very quiet and need a quiet environment"
  ]
  const cleanlinessOptions = [
    "I'm very neat and organized",
    "I'm generally tidy",
    "I'm somewhat messy but clean common areas",
    "I'm not particularly concerned with tidiness"
  ]
  const popularUniversities = [
    "Harvard University",
    "Stanford University",
    "Massachusetts Institute of Technology",
    "University of California, Berkeley",
    "University of Michigan",
    "Ohio State University",
    "University of Texas at Austin",
    "New York University",
    "University of Florida",
    "University of Washington",
    "Pennsylvania State University"
  ]
  //all of the above is data 
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  useEffect(() => {
    setUniversities(popularUniversities)
    setFilteredUniversities(popularUniversities)
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          universityInputRef.current && !universityInputRef.current.contains(event.target)) {
        setShowUniversityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  //fetchUniversities function is used to fetch universities from the API
  const fetchUniversities = async (query) => {
    if (!query || query.length < 2) return 
    
    setIsLoadingUniversities(true)
    try {
      const response = await fetch(`/api/universities?query=${encodeURIComponent(query)}`);
      const data = await response.json()
      const universityNames = [...new Set(data.map(uni => uni.name))]
      setUniversities(prev => {
        const combined = [...popularUniversities, ...universityNames]
        return [...new Set(combined)]
      })
      
      setFilteredUniversities(universityNames.slice(0, 10)) 
    } catch (error) {
      console.error('Error fetching universities:', error)
    } finally {
      setIsLoadingUniversities(false)
    }
  }

  const handleUniversitySearch = (e) => {
    const query = e.target.value
    setUniversitySearch(query)
    
    if (query.length < 2) { //if the query is less than 2 characters, it will show the popular universities
      setFilteredUniversities(popularUniversities)
      return
    }
    
    const filtered = universities.filter(uni => 
      uni.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10)
    
    setFilteredUniversities(filtered)
    const handler = setTimeout(() => {
      fetchUniversities(query)
    }, 300)
    
    return () => clearTimeout(handler)
  }

  const handleUniversitySelect = (selected) => { //this function is used to select the university
    setUniversity(selected)
    setUniversitySearch(selected)
    setShowUniversityDropdown(false)
  }

  const handlePictureChange = (e) => { //this function is used to change the profile picture
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
      setError('Please fill in all required fields')
      return false
    }
    setError('')
    return true
  }

  const calculateAge = (birthdate) => { //this function is used to calculate the age
    const today = new Date()
    const birthDate = new Date(birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleSubmitProfile = async () => { //this function is used to submit the profile
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

      const userProfileData = { //this is the data that will be stored in the database
        firstName,
        lastName,
        birthday,
        age: calculateAge(birthday),
        university,
        bio,
        profilePicture: profileImageUrl,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        email: user.email,
        lifestylePreferences: {
          smoking: smokingPreference,
          pets: petsPreference,
          noise: noisePreference,
          cleanliness: cleanlinessPreference
        }
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
          <FormHeader>Customize Your <span>Profile</span></FormHeader>
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
          <SectionTitle>Personal Information</SectionTitle>
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
            <AutocompleteContainer>
              <Input 
                ref={universityInputRef}
                type="text" 
                value={universitySearch} 
                onChange={handleUniversitySearch}
                onFocus={() => setShowUniversityDropdown(true)}
                placeholder="Search for your university"
                autoComplete="off"
              />
              {showUniversityDropdown && (
                <DropdownContainer ref={dropdownRef}>
                  {isLoadingUniversities && (
                    <DropdownItem disabled>Loading universities...</DropdownItem>
                  )}
                  {!isLoadingUniversities && filteredUniversities.length === 0 && (
                    <DropdownItem disabled>No universities found</DropdownItem>
                  )}
                  {!isLoadingUniversities && filteredUniversities.map((uni, index) => (
                    <DropdownItem 
                      key={index} 
                      onClick={() => handleUniversitySelect(uni)}
                      active={university === uni}
                    >
                      {uni}
                    </DropdownItem>
                  ))}
                </DropdownContainer>
              )}
            </AutocompleteContainer>
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

          <SectionTitle>Lifestyle Preferences</SectionTitle>
          
          <FormGroup>
            <InputTitle>Smoking</InputTitle>
            <Select
              value={smokingPreference}
              onChange={(e) => setSmokingPreference(e.target.value)}
            >
              <option value="">Select your preference</option>
              {smokingOptions.map((option, index) => ( //map is used to iterate over the array
                <option key={index} value={option}>{option}</option> //key is used to identify the element
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <InputTitle>Pets</InputTitle>
            <Select
              value={petsPreference}
              onChange={(e) => setPetsPreference(e.target.value)}
            >
              <option value="">Select your preference</option>
              {petsOptions.map((option, index) => ( 
                <option key={index} value={option}>{option}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <InputTitle>Noise Level</InputTitle>
            <Select
              value={noisePreference}
              onChange={(e) => setNoisePreference(e.target.value)}
            >
              <option value="">Select your preference</option>
              {noiseOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <InputTitle>Cleanliness</InputTitle>
            <Select
              value={cleanlinessPreference}
              onChange={(e) => setCleanlinessPreference(e.target.value)}
            >
              <option value="">Select your preference</option>
              {cleanlinessOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </Select>
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

const ProfileImage = ({ src, alt }) => ( //this is the profile image component
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

const SectionTitle = styled.h2`
  font-size: 24px;
  color: white;
  margin-top: 32px;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 107, 107, 0.3);
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
  display: flex;
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

const AutocompleteContainer = styled.div`
  width: 100%;
`;

const DropdownContainer = styled.div`
  top: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: #282828;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const DropdownItem = styled.div`
  padding: 12px 16px;
  color: white;
  cursor: pointer;
  &:hover {
    background-color: ${props => props.disabled ? 'transparent' : 'rgba(255, 107, 107, 0.1)'}; //if the dropdown item is disabled, the background color will be transparent
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

const Select = styled.select`
  font-size: 16px;
  padding: 12px 16px;
  width: 100%;
  border-radius: 8px;
  border: .37px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  background-position: right 16px center;
  background-size: 16px;
  
  &:focus {
    transition: 0.2s;
    outline: none;
    border-color: #ff6b6b;
    box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
  }
  
  option {
    background-color: #282828;
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
  
`;

export default CreateProfile