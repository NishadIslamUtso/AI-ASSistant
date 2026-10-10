import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Center from './components/Center.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import ArtifactPanel from './components/ArtifactPanel.jsx'

function readLocalArray(key, fallback = []) {
  try {
    const stored = localStorage.getItem(key)
    const parsed = stored ? JSON.parse(stored) : fallback
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [chats, setChats] = useState(() => {
    const saved = readLocalArray('claude_exact_chats', null)
    return saved || [
      {id:'1', title:'Refining a 5-day workout cycle', date:'Oct 8'},
      {id:'2', title:'Identifying your charisma type', date:'Older'},
      {id:'3', title:'Repurposing an old Realme 6i phone', date:'Older'},
      {id:'4', title:'Fix AI-generated Facebook profile picture', date:'Older'},
      {id:'5', title:'PSY 101 midterm exam preparation and pr', date:'Older'},
      {id:'10', title:'CSE220 MID', date:'Older'},
    ]
  })
  const [artifacts, setArtifacts] = useState(() => readLocalArray('claude_exact_artifacts'))
  const [currentChat, setCurrentChat] = useState(null)
  const [showVault, setShowVault] = useState(false)
  const [showArtifacts, setShowArtifacts] = useState(false)
  const [selectedArtifactId, setSelectedArtifactId] = useState(null)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    try { localStorage.setItem('claude_exact_chats', JSON.stringify(chats)) } catch (error) {
      console.warn('Could not save chats locally:', error)
    }
  }, [chats])

  useEffect(() => {
    try { localStorage.setItem('claude_exact_artifacts', JSON.stringify(artifacts)) } catch (error) {
      console.warn('Could not save artifacts locally:', error)
    }
  }, [artifacts])

  function openArtifactLibrary() {
    setSelectedArtifactId(null)
    setShowArtifacts(true)
  }

  function openArtifact(id) {
    setSelectedArtifactId(id)
    setShowArtifacts(true)
  }

  function addArtifact(artifact) {
    setArtifacts(previous => [artifact, ...previous.filter(item => item.id !== artifact.id)])
    setSelectedArtifactId(artifact.id)
    setShowArtifacts(true)
  }

  function updateArtifact(updatedArtifact) {
    setArtifacts(previous => previous.map(item => item.id === updatedArtifact.id ? updatedArtifact : item))
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#1a1a1a] text-white">
      <Sidebar
        chats={chats}
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        setChats={setChats}
        artifactCount={artifacts.length}
        onOpenArtifacts={openArtifactLibrary}
      />
      <Center
        chats={chats}
        currentChat={currentChat}
        messages={messages}
        setMessages={setMessages}
        setChats={setChats}
        showVault={showVault}
        setShowVault={setShowVault}
        onArtifactCreated={addArtifact}
        onOpenArtifact={openArtifact}
      />
      {showVault && <VaultPanel setShowVault={setShowVault} />}
      <ArtifactPanel
        isOpen={showArtifacts}
        artifacts={artifacts}
        selectedArtifactId={selectedArtifactId}
        onSelectArtifact={setSelectedArtifactId}
        onUpdateArtifact={updateArtifact}
        onClose={() => {
          setShowArtifacts(false)
          setSelectedArtifactId(null)
        }}
      />
    </div>
  )
}
