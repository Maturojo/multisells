import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function Register() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    const result = await register({ nombre: form.nombre, email: form.email, password: form.password })
    if (result.ok) {
      await Swal.fire({
        title: `¡Bienvenido/a, ${form.nombre.split(' ')[0]}! 🛍️`,
        text: 'Tu cuenta fue creada con éxito. ¡Ya sos parte de la comunidad!',
        icon: 'success',
        confirmButtonText: 'Ir a mi cuenta',
        confirmButtonColor: '#9c664d',
        background: '#FDF9F0',
        color: '#1a1209',
        iconColor: '#9c664d',
        customClass: { popup: 'swal-tienda' },
        timer: 4000,
        timerProgressBar: true,
      })
      navigate('/mi-cuenta')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  const handleGoogle = async (credential) => {
    setLoading(true)
    setError('')
    const result = await loginWithGoogle(credential)
    if (result.ok) {
      await Swal.fire({
        title: `Â¡Bienvenido/a, ${result.user?.nombre?.split(' ')[0] || ''}!`,
        text: 'Tu cuenta de Google quedÃ³ conectada.',
        icon: 'success',
        confirmButtonColor: '#9c664d',
        background: '#FDF9F0',
        color: '#1a1209',
        timer: 2500,
        timerProgressBar: true,
      })
      navigate('/mi-cuenta')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🛍️</span>
          <h1>Crear cuenta</h1>
          <p>Unite y empezá a comprar online</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input
              required placeholder="Juan García"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email" required placeholder="tu@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password" required placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password" required placeholder="Repetí tu contraseña"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-separator"><span>o</span></div>
        <GoogleLoginButton onCredential={handleGoogle} disabled={loading} />

        <p className="auth-switch">
          ¿Ya tenés cuenta? <Link to="/login" className="auth-link">Iniciá sesión</Link>
        </p>
      </div>
    </main>
  )
}
