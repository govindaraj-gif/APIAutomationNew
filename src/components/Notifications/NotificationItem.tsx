import React from 'react';
import styled from 'styled-components';
import { useNotification } from '../../context/NotificationContext';
import { 
  FaBell, 
  FaExclamationTriangle, 
  FaServer, 
  FaCreditCard
} from 'react-icons/fa';

// --------------------
// Types
// --------------------

type NotificationType = 'system' | 'execution' | 'payment' | 'error' | 'default';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  workspace?: string;
  actionUrl?: string;
}

interface NotificationItemProps {
  notification: Notification;
}

interface StyledContainerProps {
  isRead: boolean;
}

interface StyledIconProps {
  notificationType: NotificationType;
}

// --------------------
// Styled Components
// --------------------

const NotificationContainer = styled.div<StyledContainerProps>`
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  transition: background-color 0.2s;
  background-color: ${props => props.isRead ? 'transparent' : '#f0f7ff'};

  &:hover {
    background-color: ${props => props.isRead ? '#f8f9fa' : '#e6f3ff'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const IconContainer = styled.div<StyledIconProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  border-radius: 50%;
  margin-right: 12px;
  background-color: ${props => {
    switch (props.notificationType) {
      case 'system':
        return '#e9ecef';
      case 'execution':
        return '#e3f2fd';
      case 'payment':
        return '#f1f8e9';
      case 'error':
        return '#ffebee';
      default:
        return '#f8f9fa';
    }
  }};
  color: ${props => {
    switch (props.notificationType) {
      case 'system':
        return '#6c757d';
      case 'execution':
        return '#1976d2';
      case 'payment':
        return '#43a047';
      case 'error':
        return '#e53935';
      default:
        return '#212529';
    }
  }};
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.div<StyledContainerProps>`
  font-weight: ${props => props.isRead ? '400' : '600'};
  margin-bottom: 4px;
  font-size: 14px;
`;

const Message = styled.div`
  color: #6c757d;
  font-size: 13px;
  margin-bottom: 8px;
`;

const MetaInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #adb5bd;
`;

// --------------------
// Component
// --------------------

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead } = useNotification();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'system':
        return <FaBell />;
      case 'execution':
        return <FaServer />;
      case 'payment':
        return <FaCreditCard />;
      case 'error':
        return <FaExclamationTriangle />;
      default:
        return <FaBell />;
    }
  };

  const getTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) {
        return 'just now';
      } else if (diffMins < 60) {
        return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      } else if (diffDays < 7) {
        return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <NotificationContainer isRead={notification.read} onClick={handleClick}>
      <IconContainer notificationType={notification.type}>
        {getIcon()}
      </IconContainer>
      <Content>
        <Title isRead={notification.read}>{notification.title}</Title>
        <Message>{notification.message}</Message>
        <MetaInfo>
          <span>{getTimeAgo(notification.createdAt)}</span>
          {notification.workspace && <span>{notification.workspace}</span>}
        </MetaInfo>
      </Content>
    </NotificationContainer>
  );
};

export default NotificationItem;
