import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('token', token)
      navigate('/', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return (
    <div style={{ color: '#e6edf3', textAlign: 'center', marginTop: '50px', background: '#0d1117', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Authenticating with GitHub...</p>
      </div>
    </div>
  )
}