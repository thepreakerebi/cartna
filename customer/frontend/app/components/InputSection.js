'use client';

import { useState } from 'react';
import { Mic, X, ArrowUp } from 'lucide-react';
import styles from './InputSection.module.css';

export default function InputSection() {
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleSubmit = () => {
    if (input.trim()) {
      // Handle submission logic here
      setInput('');
    }
  };

  return (
    <div className={styles.inputSection}>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your grocery list or use voice command"
          className={styles.input}
          disabled={isRecording}
        />
        {isRecording && (
          <div className={styles.recordingUI}>
            <div className={styles.recordingIndicator}>
              Recording...
            </div>
          </div>
        )}
      </div>
      <div className={styles.actionsContainer}>
        <button
          onClick={toggleRecording}
          className={`${styles.actionButton} ${styles.micButton}`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <Mic size={24} />
        </button>
        {isRecording && (
          <button
            onClick={toggleRecording}
            className={`${styles.actionButton} ${styles.cancelButton}`}
            aria-label="Cancel recording"
          >
            <X size={24} />
          </button>
        )}
        <button
          onClick={handleSubmit}
          className={`${styles.actionButton} ${styles.submitButton}`}
          aria-label="Submit"
          disabled={!input.trim() && !isRecording}
        >
          <ArrowUp size={24} />
        </button>
      </div>
    </div>
  );
}