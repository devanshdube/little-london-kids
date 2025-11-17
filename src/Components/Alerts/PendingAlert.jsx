import { Clock } from 'lucide-react';
import BaseAlert from './BaseAlert';

const PendingAlert = ({ message, onClose }) => {
  const config = {
    icon: Clock,
    primary: '#3b82f6',
    secondary: '#60a5fa',
    shadow: 'rgba(59,130,246,0.4)',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)'
  };
  return <BaseAlert config={config} message={message} onClose={onClose} />;
};

export default PendingAlert;
