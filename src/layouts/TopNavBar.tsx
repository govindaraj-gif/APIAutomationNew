import React from 'react';
import { FaCog, FaBell, FaUser } from 'react-icons/fa';
import NotificationBell from '../components/Notifications/NotificationBell';
import { NotificationProvider } from '../context/NotificationContext';

const TopNavbar: React.FC = () => {
  return (
        <nav className="bg-white border-b p-4 text-black">
            <div className="flex items-center justify-between">
                <div className="text-xl">My App</div>
                <div className="flex items-center space-x-4">
                <button className="text-black hover:text-gray-400">
                    <FaCog size={20} />
                </button>
                <NotificationBell/>
                <button className="text-black hover:text-gray-400">
                    <FaUser size={20} />
                </button>
                </div>
            </div>
        </nav>
  );
};

export default TopNavbar;
