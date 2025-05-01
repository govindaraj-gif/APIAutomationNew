import React from 'react';
import { FaCog, FaBell, FaUser } from 'react-icons/fa';
import NotificationBell from '../components/Notifications/NotificationBell';
import { NotificationProvider } from '../context/NotificationContext';

const TopNavbar: React.FC = () => {
  return (
        <nav className="bg-gray-800 p-4">
            <div className="flex items-center justify-between">
                <div className="text-white text-xl">My App</div>
                <div className="flex items-center space-x-4">
                <button className="text-white hover:text-gray-400">
                    <FaCog size={20} />
                </button>
                <NotificationBell/>
                <button className="text-white hover:text-gray-400">
                    <FaUser size={20} />
                </button>
                </div>
            </div>
        </nav>
  );
};

export default TopNavbar;
