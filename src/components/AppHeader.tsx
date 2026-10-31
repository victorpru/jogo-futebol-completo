import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type HeaderPage = 'home' | 'npc' | 'items' | 'winners' | 'rules'

interface AppHeaderProps {
  activePage: HeaderPage
  onNavigate: (page: HeaderPage) => void
}

export function AppHeader({ activePage, onNavigate }: AppHeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (result.error) {
      setMessage(result.error.message)
      return
    }
    setPassword('')
    setMessage(mode === 'signup' ? 'Cadastro criado. Verifique seu e-mail se a confirmação estiver ativada.' : 'Login realizado.')
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) setMessage(error.message)
  }

  const signInWithGoogle = async () => {
    setMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setMessage(error.message)
  }

  return <header className="header">
    <div className="logo"><span>◆</span> DECK<span>FC</span></div>
    <div className="header-copy"><span>FOOTBALL DECK BUILDING</span><strong>Construção de deck</strong></div>
    <nav className="main-nav" aria-label="Navegação principal">
      <button className={activePage === 'home' ? 'nav-active' : ''} onClick={() => onNavigate('home')}>Home</button>
      <button className={activePage === 'npc' ? 'nav-active' : ''} onClick={() => onNavigate('npc')}>Sorteio NPC</button>
      <button className={activePage === 'items' ? 'nav-active' : ''} onClick={() => onNavigate('items')}>Itens</button>
      <button className={activePage === 'winners' ? 'nav-active' : ''} onClick={() => onNavigate('winners')}>Vencedores</button>
      <button className={activePage === 'rules' ? 'nav-active' : ''} onClick={() => onNavigate('rules')}>Regras</button>
    </nav>
    <div className="auth-area">
      {user ? <><span className="auth-email">{user.email}</span><button className="auth-button" onClick={signOut}>Sair</button></> : <button className="auth-button" onClick={() => setAuthOpen(true)}>Entrar</button>}
    </div>
    {authOpen && !user && <div className="auth-modal-backdrop" onClick={() => setAuthOpen(false)}>
      <form className="auth-modal" onSubmit={submitAuth} onClick={(event) => event.stopPropagation()}>
        <button className="auth-close" type="button" onClick={() => setAuthOpen(false)} aria-label="Fechar">×</button>
        <span className="eyebrow">CONTA DE JOGADOR</span>
        <h2>{mode === 'login' ? 'Entrar no Deck FC' : 'Criar sua conta'}</h2>
        <label>E-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Senha<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
        <button className="auth-google" type="button" onClick={signInWithGoogle}>Continuar com Google</button>
        {message && <p className="auth-message">{message}</p>}
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>
          {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}
        </button>
      </form>
    </div>}
  </header>
}
