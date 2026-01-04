"use client";

import { useState } from "react";
import styles from "./page.module.css"
import InputField from "./components/input/inputField";
import Button from "./components/button/button";

export default function App() {
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function verifyUser() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({action:"verify", email, password })
      })

      const data = await res.json()

      if (res.ok) {
        alert('Login successfull!')
        setEmail('')
        setPassword('')
        sessionStorage.setItem('token', data.token);
      } else {
        setError(data.error || 'Failed verify user')
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
      <div className={styles.buttons}>
        <Button title="Login" onClick={verifyUser} />
        <a href="/register">Register</a>
      </div>
    </div>

  );
}
