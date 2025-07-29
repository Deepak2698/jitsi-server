import React, { useState, useEffect } from 'react';
import RemoteAccessComponent, { RemoteAccessType } from './RemoteAccessComponent';
import './RemoteAccessComponent.css';

/**
 * Example EdTech LMS Integration
 * 
 * This example demonstrates how to integrate the Remote Access Component
 * with Jitsi Meet in an EdTech Learning Management System.
 */

function EdTechLMSExample() {
  // State for managing participants and current user
  const [currentUser, setCurrentUser] = useState({
    id: 'trainer-001',
    name: 'Dr. Sarah Johnson',
    role: 'trainer'
  });

  const [participants, setParticipants] = useState([
    {
      id: 'student-001',
      name: 'Alice Chen',
      role: 'student',
      isOnline: true
    },
    {
      id: 'student-002',
      name: 'Bob Rodriguez',
      role: 'student',
      isOnline: true
    },
    {
      id: 'student-003',
      name: 'Carol Williams',
      role: 'student',
      isOnline: false
    }
  ]);

  const [remoteAccessRequests, setRemoteAccessRequests] = useState([]);
  const [isComponentVisible, setIsComponentVisible] = useState(true);

  // Custom instructions for this session
  const customInstructions = `
    Before granting remote access:
    1. Close any personal applications (email, social media, etc.)
    2. Ensure your screen is visible and well-lit
    3. Have your course materials ready
    4. Be prepared to follow the trainer's guidance
  `;

  // Handle remote access request sent
  const handleRequestSent = (request) => {
    console.log('🚀 Remote access request sent:', request);
    
    // Add to local state for tracking
    setRemoteAccessRequests(prev => [...prev, request]);
    
    // In a real application, you would:
    // 1. Send the request to your backend
    // 2. Store it in your database
    // 3. Send a notification to the target user
    // 4. Log the event for audit purposes
    
    // Example API call:
    // fetch('/api/remote-access/request', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request)
    // });
  };

  // Handle remote access request received
  const handleRequestReceived = (request) => {
    console.log('📨 Remote access request received:', request);
    
    // Show notification to the user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Remote Access Request', {
        body: `${request.requesterName} is requesting remote access to your computer.`,
        icon: '/path/to/icon.png'
      });
    }
  };

  // Handle remote access request accepted
  const handleRequestAccepted = (request) => {
    console.log('✅ Remote access request accepted:', request);
    
    // Update local state
    setRemoteAccessRequests(prev => 
      prev.map(r => r.id === request.id ? { ...r, status: 'accepted' } : r)
    );
    
    // In a real application, you would:
    // 1. Update the request status in your database
    // 2. Send the access credentials to the requester
    // 3. Log the acceptance for audit purposes
    // 4. Start monitoring the remote session
    
    // Example API call:
    // fetch('/api/remote-access/accept', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ requestId: request.id })
    // });
  };

  // Handle remote access request rejected
  const handleRequestRejected = (request) => {
    console.log('❌ Remote access request rejected:', request);
    
    // Update local state
    setRemoteAccessRequests(prev => 
      prev.map(r => r.id === request.id ? { ...r, status: 'rejected' } : r)
    );
    
    // In a real application, you would:
    // 1. Update the request status in your database
    // 2. Notify the requester about the rejection
    // 3. Log the rejection for audit purposes
  };

  // Handle remote access request cancelled
  const handleRequestCancelled = (request) => {
    console.log('🚫 Remote access request cancelled:', request);
    
    // Update local state
    setRemoteAccessRequests(prev => 
      prev.map(r => r.id === request.id ? { ...r, status: 'cancelled' } : r)
    );
    
    // In a real application, you would:
    // 1. Update the request status in your database
    // 2. Notify the target user about the cancellation
    // 3. Log the cancellation for audit purposes
  };

  // Custom translations for your LMS
  const customTranslations = {
    'remoteAccess.title.trainer': 'Remote Support - Instructor',
    'remoteAccess.title.student': 'Remote Support - Student',
    'remoteAccess.subtitle.trainer': 'Request remote access to help students with technical issues',
    'remoteAccess.subtitle.student': 'Accept remote access requests from your instructor',
    'remoteAccess.requestButton': 'Request Remote Access',
    'remoteAccess.cancelButton': 'Cancel Request',
    'remoteAccess.selectParticipant': 'Select Student',
    'remoteAccess.selectParticipantPlaceholder': 'Choose a student...',
    'remoteAccess.selectAccessType': 'Select Remote Access Tool',
    'remoteAccess.instructions.title': 'Instructions',
    'remoteAccess.instructions.trainer': 'Click the button above to request remote access to the selected student\'s computer. This will help you provide technical support during the session.',
    'remoteAccess.instructions.student': 'You will receive a notification when your instructor requests remote access to your computer. You can accept or reject the request.',
    'remoteAccess.types.rustdesk': 'RustDesk (Recommended)',
    'remoteAccess.types.chrome_rdp': 'Chrome Remote Desktop',
    'remoteAccess.types.anydesk': 'AnyDesk',
    'remoteAccess.rustDesk.title': 'RustDesk Connection Instructions',
    'remoteAccess.rustDesk.step1': 'Download and install RustDesk from the link below',
    'remoteAccess.rustDesk.step2': 'Open RustDesk and enter the ID shown below',
    'remoteAccess.rustDesk.step3': 'Enter the password when prompted',
    'remoteAccess.rustDesk.idLabel': 'RustDesk ID',
    'remoteAccess.rustDesk.passwordLabel': 'Password',
    'remoteAccess.chromeRdp.title': 'Chrome Remote Desktop Instructions',
    'remoteAccess.chromeRdp.step1': 'Go to Chrome Remote Desktop website',
    'remoteAccess.chromeRdp.step2': 'Enter the access code shown below',
    'remoteAccess.chromeRdp.step3': 'Grant access when prompted',
    'remoteAccess.chromeRdp.idLabel': 'Access Code',
    'remoteAccess.chromeRdp.passwordLabel': 'Password',
    'remoteAccess.anyDesk.title': 'AnyDesk Connection Instructions',
    'remoteAccess.anyDesk.step1': 'Download and install AnyDesk from the link below',
    'remoteAccess.anyDesk.step2': 'Enter the AnyDesk address shown below',
    'remoteAccess.anyDesk.step3': 'Enter the password when prompted',
    'remoteAccess.anyDesk.idLabel': 'AnyDesk Address',
    'remoteAccess.anyDesk.passwordLabel': 'Password',
    'remoteAccess.downloadLink': 'Download Link',
    'remoteAccess.customInstructions': 'Session Instructions',
    'remoteAccess.requestDialog.title': 'Remote Access Request',
    'remoteAccess.requestDialog.message': '{trainer} is requesting remote access to your computer using {type}. Do you want to allow this?',
    'remoteAccess.unknownUser': 'Unknown User',
    'dialog.accept': 'Accept',
    'dialog.reject': 'Reject',
    'dialog.close': 'Close'
  };

  // Simulate participant joining/leaving (in a real app, this would come from Jitsi Meet events)
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants(prev => 
        prev.map(p => ({
          ...p,
          isOnline: Math.random() > 0.1 // 90% chance of being online
        }))
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="edtech-lms-container">
      {/* Header */}
      <header className="lms-header">
        <h1>📚 Advanced Computer Science 101</h1>
        <p>Instructor: Dr. Sarah Johnson | Students: {participants.filter(p => p.isOnline).length} online</p>
        
        {/* Toggle button for remote access component */}
        <button 
          onClick={() => setIsComponentVisible(!isComponentVisible)}
          className="toggle-button"
        >
          {isComponentVisible ? 'Hide' : 'Show'} Remote Access
        </button>
      </header>

      <div className="main-content">
        {/* Jitsi Meet iframe */}
        <div className="video-container">
          <h3>🎥 Live Session</h3>
          <iframe 
            src="https://meet.jit.si/advanced-cs101-2024"
            width="100%"
            height="500"
            frameBorder="0"
            allow="camera; microphone; fullscreen; speaker; display-capture"
            title="Live Class Session"
          />
        </div>

        {/* Remote Access Component */}
        {isComponentVisible && (
          <div className="remote-access-wrapper">
            <RemoteAccessComponent
              currentUser={currentUser}
              participants={participants}
              isVisible={isComponentVisible}
              customInstructions={customInstructions}
              onRequestSent={handleRequestSent}
              onRequestReceived={handleRequestReceived}
              onRequestAccepted={handleRequestAccepted}
              onRequestRejected={handleRequestRejected}
              onRequestCancelled={handleRequestCancelled}
              translations={customTranslations}
            />
          </div>
        )}
      </div>

      {/* Debug panel (remove in production) */}
      <div className="debug-panel">
        <h4>🔧 Debug Information</h4>
        <div className="debug-info">
          <p><strong>Current User:</strong> {currentUser.name} ({currentUser.role})</p>
          <p><strong>Online Participants:</strong> {participants.filter(p => p.isOnline).length}</p>
          <p><strong>Active Requests:</strong> {remoteAccessRequests.filter(r => r.status === 'waiting').length}</p>
        </div>
        
        <div className="debug-requests">
          <h5>Recent Requests:</h5>
          {remoteAccessRequests.slice(-3).map(request => (
            <div key={request.id} className="debug-request">
              <span className={`status-${request.status}`}>{request.status}</span>
              <span>{request.requesterId} → {request.targetId}</span>
              <span>{new Date(request.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional LMS features */}
      <div className="lms-features">
        <div className="feature-card">
          <h4>📋 Course Materials</h4>
          <ul>
            <li>Week 5: Advanced Algorithms</li>
            <li>Assignment 3: Due Friday</li>
            <li>Reading: Chapter 8-10</li>
          </ul>
        </div>
        
        <div className="feature-card">
          <h4>💬 Chat</h4>
          <div className="chat-messages">
            <div className="message">
              <strong>Alice:</strong> Can someone help me with the sorting algorithm?
            </div>
            <div className="message">
              <strong>Dr. Johnson:</strong> I'll help you with that. Let me request remote access to your screen.
            </div>
          </div>
        </div>
        
        <div className="feature-card">
          <h4>📊 Attendance</h4>
          <div className="attendance-list">
            {participants.map(participant => (
              <div key={participant.id} className={`attendance-item ${participant.isOnline ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                {participant.name} ({participant.role})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Additional CSS for the example
const additionalStyles = `
  .edtech-lms-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .lms-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .lms-header h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
  }

  .lms-header p {
    margin: 0 0 16px 0;
    opacity: 0.9;
  }

  .toggle-button {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .toggle-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 20px;
    margin-bottom: 20px;
  }

  .video-container {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .video-container h3 {
    margin: 0 0 16px 0;
    color: #374151;
  }

  .remote-access-wrapper {
    position: sticky;
    top: 20px;
  }

  .debug-panel {
    background: #f3f4f6;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .debug-panel h4 {
    margin: 0 0 12px 0;
    color: #374151;
  }

  .debug-info {
    margin-bottom: 16px;
  }

  .debug-info p {
    margin: 4px 0;
  }

  .debug-requests h5 {
    margin: 0 0 8px 0;
    color: #374151;
  }

  .debug-request {
    display: flex;
    gap: 12px;
    margin: 4px 0;
    font-size: 12px;
  }

  .status-waiting { color: #f59e0b; }
  .status-accepted { color: #10b981; }
  .status-rejected { color: #ef4444; }
  .status-cancelled { color: #6b7280; }

  .lms-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .feature-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .feature-card h4 {
    margin: 0 0 12px 0;
    color: #374151;
  }

  .chat-messages {
    max-height: 200px;
    overflow-y: auto;
  }

  .message {
    margin: 8px 0;
    padding: 8px;
    background: #f9fafb;
    border-radius: 6px;
    font-size: 14px;
  }

  .attendance-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .attendance-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .online .status-dot {
    background: #10b981;
  }

  .offline .status-dot {
    background: #6b7280;
  }

  @media (max-width: 768px) {
    .main-content {
      grid-template-columns: 1fr;
    }
    
    .remote-access-wrapper {
      position: static;
    }
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = additionalStyles;
  document.head.appendChild(style);
}

export default EdTechLMSExample; 