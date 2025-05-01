import React from 'react';
import { IoMdNotifications } from 'react-icons/io';
import styled from 'styled-components';
import { useNotification } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import { FaBell } from 'react-icons/fa';

// Styled Components
const BellContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-right: 15px;
  cursor: pointer;
`;

const NotificationIcon = styled.div`
  position: relative;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: color 0.2s;
  
  &:hover {
    color: #333;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -3px;
  right: -3px;
  background-color: #ff0000;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 2px solid white;
`;

// TypeScript version of NotificationBell component
const NotificationBell: React.FC = () => {
  const { 
    unreadCount, 
    isDropdownOpen,
    toggleDropdown,
    markAllAsRead 
  } = useNotification();

  // Type the event parameter for the event handler
  const handleMarkAllAsRead = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    e.stopPropagation();
    markAllAsRead();
  };

  return (
    <BellContainer>
      <FaBell onClick={toggleDropdown} className="text-white hover:text-gray-400" size={20}>
        <IoMdNotifications />
        {unreadCount > 0 && (
          <NotificationBadge>
            {unreadCount > 99 ? '99+' : unreadCount}
          </NotificationBadge>
        )}
      </FaBell>
      
      {isDropdownOpen && (
        <NotificationDropdown 
          onClose={toggleDropdown} 
          onMarkAllAsRead={handleMarkAllAsRead}
          show={true}
        />
      )}
    </BellContainer>
  );
};

export default NotificationBell;
