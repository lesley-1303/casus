"use client";

import { useState } from "react";
import styles from "./page.module.css"
import InputField from "./components/input/inputField";

export default function App() {
  const [name, setName] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function addUser() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (res.ok) {
        alert('User created successfully!')
        setName('')
        setEmail('')
        setPassword('')
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.login}>
      <InputField
        title="username"
        variant="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="enter username"
      />
      <InputField
        title="email"
        variant="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="enter email"
      />
      <InputField
        title="password"
        variant="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="enter password"
      />
      <button onClick={addUser}>Get Users</button>
    </div>
  );
}
