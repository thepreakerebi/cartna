'use client';

import styles from './QuerySection.module.css';

export default function QuerySection() {
  return (
    <section className={styles.querySection}>
      <div className={styles.queryPrompt}>
        <h2>What do you want to buy today?</h2>
      </div>
      <div className={styles.exampleQueries}>
        <h3>Try these examples:</h3>
        <ul>
          <li>{"I need rice, cooking oil, and sugar"}</li>
          <li>{"Looking for fresh vegetables for soup"}</li>
          <li>{"Baby food and diapers"}</li>
          <li>{"Breakfast cereals and milk"}</li>
          <li>{"Snacks and soft drinks for a party"}</li>
        </ul>
      </div>
    </section>
  );
}