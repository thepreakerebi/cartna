'use client';

import { useState } from 'react';
import { Mic, X, ArrowUp } from 'lucide-react';
import styles from './InputSection.module.css';
import { useSearch } from '@/store/searchContext';

export default function InputSection() {
  const { searchProducts, isLoading, error } = useSearch();
  const [isRecording, setIsRecording] = useState(false);
  const [input, setInput] = useState('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && input.trim() && !isLoading) {
      await handleSubmit();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleSubmit = async () => {
    if (input.trim()) {
      await searchProducts(input);
      setInput('');
    }
  };

  return (
    <div className={styles.inputSection}>
      <div className={styles.mainContainer}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type what you want to buy or use voice command"
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
            type="submit"
            disabled={!input.trim() && !isRecording || isLoading}
          >
            {isLoading ? 'Searching...' : <ArrowUp size={24} />}
            {error && <div className={styles.error}>{error}</div>}
          </button>
        </div>
      </div>
    </div>
  );
}