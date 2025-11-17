import { WifiOff } from 'lucide-react';
import BaseAlert from './BaseAlert';

const OfflineAlert = ({ message, onClose }) => {
  const config = {
    icon: WifiOff,
    primary: '#6b7280',
    secondary: '#9ca3af',
    shadow: 'rgba(107,114,128,0.4)',
    gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)'
  };
  return <BaseAlert config={config} message={message} onClose={onClose} />;
};

export default OfflineAlert;
