import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function GoogleLoginButton({ onCredential, disabled }) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return
    let mounted = true
    loadGoogleScript()
      .then(() => {
        if (!mounted) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          width: ref.current.offsetWidth || 320,
          text: 'continue_with',
        })
        setReady(true)
      })
      .catch(() => setReady(false))
    return () => { mounted = false }
  }, [onCredential])

  if (!CLIENT_ID) {
    return <p className="auth-google-note">Google Login todavia no esta configurado.</p>
  }

  return (
    <div className={disabled ? 'google-login-wrap disabled' : 'google-login-wrap'} aria-busy={!ready || disabled}>
      <div ref={ref} />
    </div>
  )
}
