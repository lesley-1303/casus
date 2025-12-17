"use client";

import { useState } from "react";
import styles from "./page.module.css"
import InputField from "./components/input/inputField";

export default function App() {
  const [name, setName] = useState<string>();
  const [age, setAge] = useState<number>();
  const [date, setDate] = useState<Date>();
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
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
        title="age"
        variant="number"
        value={age}
        onChange={(e) => {
          const value = e.target.value;
          setAge(value === "" ? undefined : Number(value));
        }}
        placeholder="enter age"
        min={0}
      />
      <InputField
        title="date"
        variant="date"
        value={date}
        onChange={(e) => {
          const value = e.target.value;
          setDate(value ? new Date(value) : undefined);
        }}
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
    </div>
  );
}
