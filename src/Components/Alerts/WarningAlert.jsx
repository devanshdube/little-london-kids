import { AlertTriangle } from 'lucide-react';
import BaseAlert from './BaseAlert';

const WarningAlert = ({ message, onClose }) => {
  const config = {
    icon: AlertTriangle,
    primary: '#f59e0b',
    secondary: '#fbbf24',
    shadow: 'rgba(245,158,11,0.4)',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
  };
  return <BaseAlert config={config} message={message} onClose={onClose} />;
};

export default WarningAlert;
