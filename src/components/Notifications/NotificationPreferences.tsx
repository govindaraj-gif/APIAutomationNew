import React, { useState, useEffect, ChangeEvent } from 'react';
import Modal from 'react-modal';
import { NotificationPreference, useNotification } from '../../context/NotificationContext';
import { FaCheckCircle, FaBell, FaServer, FaCreditCard, FaTimes } from 'react-icons/fa';

Modal.setAppElement('#root');

type NotificationPreferencesProps = {
  show: boolean;
  handleClose: () => void;
};

type Preferences = NotificationPreference;

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: '0',
    border: 'none',
    borderRadius: '0.5rem',
    width: '500px',
    maxWidth: '90%',
    backgroundColor: '#fff', // ensure background is visible
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
};

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ show, handleClose }) => {
  const { preferences, updatePreferences } = useNotification();
  const [formData, setFormData] = useState(preferences);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(preferences);
  }, [preferences]);

  const handleChange = (field: keyof Preferences) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await updatePreferences(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const onRequestClose = () => {
    setFormData(preferences);
    setSaveSuccess(false);
    handleClose();
  };

  return (
    <Modal
      isOpen={show}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      style={modalStyles}
      contentLabel="Notification Preferences"
    >
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center border-b p-5">
          <h2 className="text-xl font-semibold">Notification Preferences</h2>
          <button onClick={onRequestClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-5">
          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-medium mb-4">Notification Types</h3>
            {[
              { key: 'systemEnabled', icon: <FaBell />, title: 'System Notifications', desc: 'Important updates about your account and the platform' },
              { key: 'executionEnabled', icon: <FaServer />, title: 'Execution Notifications', desc: 'Alerts about API executions, tests, and chain requests' },
              { key: 'paymentEnabled', icon: <FaCreditCard />, title: 'Payment Notifications', desc: 'Billing updates, subscription changes, and payment receipts' },
            ].map(({ key, icon, title, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">{icon}</div>
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData[key as keyof Preferences] as boolean}
                      onChange={handleChange(key as keyof Preferences)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Delivery Preferences */}
          <div>
            <h3 className="text-lg font-medium mb-4">Delivery Preferences</h3>
            {[
              { key: 'desktopNotificationsEnabled', title: 'Desktop Notifications', desc: 'Show pop-up notifications in your browser' },
              { key: 'emailNotificationsEnabled', title: 'Email Notifications', desc: 'Send notification summaries to your email' },
            ].map(({ key, title, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b">
                <div>
                  <div className="font-medium">{title}</div>
                  <div className="text-sm text-gray-500">{desc}</div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData[key as keyof Preferences] as boolean}
                      onChange={handleChange(key as keyof Preferences)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-300"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Do Not Disturb */}
          <div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Do Not Disturb</div>
                <div className="text-sm text-gray-500">Mute notifications during specific hours</div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only" checked={formData.doNotDisturbEnabled} onChange={handleChange('doNotDisturbEnabled')} />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            </div>

            {formData.doNotDisturbEnabled && (
              <div className="flex gap-4 mt-2">
                <div className="flex flex-col">
                  <label className="text-sm font-medium">From:</label>
                  <input type="time" className="border rounded px-2 py-1" value={formData.doNotDisturbFrom} onChange={handleChange('doNotDisturbFrom')} />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium">To:</label>
                  <input type="time" className="border rounded px-2 py-1" value={formData.doNotDisturbTo} onChange={handleChange('doNotDisturbTo')} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-4">
          {saveSuccess && (
            <div className="text-green-600 flex items-center gap-2">
              <FaCheckCircle />
              Preferences saved successfully
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <button onClick={onRequestClose} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save Preferences</button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationPreferences;
