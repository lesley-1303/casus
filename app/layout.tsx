import styles from "./layout.module.css";
import NavBar from "./components/navBar/navBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={styles.begin}>
        <NavBar/>
        {children}
      </body>
    </html>
  );
}
