import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:4000/users';
const INTERNAL_SECRET = 'healify-internal-secret';

function App() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });

  useEffect(() => {
    fetchUserCount();
  }, []);

  const fetchUserCount = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/users/count`, {
        secret: INTERNAL_SECRET
      });
      setUserCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch user count:', error);
      setUserCount(null); // Keep or show error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsSending(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/notifications`, {
        secret: INTERNAL_SECRET,
        title,
        message,
        type: 'GENERAL',
      });

      setToast({ show: true, msg: 'Notification sent successfully!' });
      setTitle('');
      setMessage('');

      setTimeout(() => {
        setToast({ show: false, msg: '' });
      }, 3000);

    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Check console for details.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="toast"
          >
            <CheckCircle size={24} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
      >
        <h1 className="heading">Healify Admin</h1>

        <motion.div
          className="stat-card"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Users size={48} color="rgba(255, 255, 255, 0.9)" />
          <div className="stat-value">
            {isLoading ? (
              <span style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.5)' }}>Loading...</span>
            ) : (
              userCount !== null ? userCount : '?'
            )}
          </div>
          <div className="stat-label">Total Users</div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel"
      >
        <h2 className="heading" style={{ fontSize: '2rem' }}>Broadcast Notification</h2>
        <form className="notification-form" onSubmit={handleSendNotification}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="title">Notification Title</label>
            <input
              id="title"
              type="text"
              className="input-field"
              placeholder="E.g., System Update, Welcome Offer..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="message">Notification Message</label>
            <textarea
              id="message"
              className="input-field"
              placeholder="Type your message here..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={isSending || !title || !message}
          >
            {isSending ? (
              <span style={{ opacity: 0.8 }}>Sending...</span>
            ) : (
              <>
                <Send size={20} />
                Send to All Users
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default App;
