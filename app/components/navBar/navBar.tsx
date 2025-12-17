"use client";

import { useRouter } from "next/navigation";
import { navBarProperty } from "./navBarProps";
import styles from "./navBar.module.css";

export default function Navbar() {
  const router = useRouter();
  const allPages: navBarProperty[] = [
    { name: "Login", route: "/", emoji: "🔑"},
    { name: "Home", route: "/home", emoji: "🏠" },
  ];

  return (
    <nav className={styles.nav}>
      {allPages.map((e) => (
        <button
          key={e.route}
          onClick={() => router.push(e.route)}
          className={styles.navButton}
        >
          {e.name} {e.emoji}
        </button>
      ))}
    </nav>
  );
}
