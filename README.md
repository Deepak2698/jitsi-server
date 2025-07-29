# Remote Access Component for EdTech LMS

A React component that provides remote access functionality for EdTech Learning Management Systems (LMS) integrated with Jitsi Meet. This component allows trainers to request remote access to students' computers and for students to accept/reject these requests.

## Features

✅ **Multi-Platform Support**: Supports RustDesk, Chrome Remote Desktop, and AnyDesk
✅ **Role-Based Access**: Different interfaces for trainers and students
✅ **Real-time Status Updates**: Live status tracking of remote access requests
✅ **Audit Logging**: Comprehensive logging for compliance and monitoring
✅ **Responsive Design**: Works on desktop and mobile devices
✅ **Dark Mode Support**: Automatic dark mode detection
✅ **Customizable**: Easy to integrate and customize for your LMS
✅ **TypeScript Support**: Full TypeScript definitions included

## Quick Start

### Installation

```bash
npm install remote-access-component
# or
yarn add remote-access-component
```

### Basic Usage

```tsx
import React from 'react';
import RemoteAccessComponent, { RemoteAccessType } from './RemoteAccessComponent';
import './RemoteAccessComponent.css';

function App() {
  const currentUser = {
    id: 'user-1',
    name: 'John Trainer',
    role: 'trainer' as const
  };

  const participants = [
    {
      id: 'user-2',
      name: 'Alice Student',
      role: 'student' as const,
      isOnline: true
    },
    {
      id: 'user-3',
      name: 'Bob Student',
      role: 'student' as const,
      isOnline: true
    }
  ];

  const handleRequestSent = (request) => {
    console.log('Remote access request sent:', request);
    // Send request to your backend/LMS
  };

  const handleRequestAccepted = (request) => {
    console.log('Remote access request accepted:', request);
    // Handle accepted request
  };

  return (
    <div className="app">
      <h1>My EdTech Platform</h1>
      
      {/* Jitsi Meet iframe */}
      <iframe 
        src="https://meet.jit.si/your-meeting-room"
        width="800"
        height="600"
        frameBorder="0"
      />
      
      {/* Remote Access Component */}
      <RemoteAccessComponent
        currentUser={currentUser}
        participants={participants}
        customInstructions="Please ensure your screen is visible and close any sensitive applications."
        onRequestSent={handleRequestSent}
        onRequestAccepted={handleRequestAccepted}
        onRequestRejected={(request) => console.log('Request rejected:', request)}
        onRequestCancelled={(request) => console.log('Request cancelled:', request)}
      />
    </div>
  );
}

export default App;
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `currentUser` | `object` | Current user information |
| `participants` | `array` | List of participants in the session |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isVisible` | `boolean` | `true` | Whether the component is visible |
| `customInstructions` | `string` | `undefined` | Custom instructions to show when access is granted |
| `onRequestSent` | `function` | `undefined` | Callback when a request is sent |
| `onRequestReceived` | `function` | `undefined` | Callback when a request is received |
| `onRequestAccepted` | `function` | `undefined` | Callback when a request is accepted |
| `onRequestRejected` | `function` | `undefined` | Callback when a request is rejected |
| `onRequestCancelled` | `function` | `undefined` | Callback when a request is cancelled |
| `translations` | `object` | `{}` | Custom translations |

## Data Types

### Participant

```typescript
interface Participant {
  id: string;
  name: string;
  role: 'trainer' | 'student';
  isOnline: boolean;
}
```

### RemoteAccessRequest

```typescript
interface RemoteAccessRequest {
  id: string;
  requesterId: string;
  targetId: string;
  accessType: RemoteAccessType;
  status: RemoteAccessStatus;
  timestamp: number;
  accessData?: {
    sessionId: string;
    id: string;
    password: string;
    type: string;
  };
}
```

### RemoteAccessType

```typescript
enum RemoteAccessType {
  RUSTDESK = 'rustdesk',
  CHROME_RDP = 'chrome_rdp',
  ANYDESK = 'anydesk'
}
```

### RemoteAccessStatus

```typescript
enum RemoteAccessStatus {
  IDLE = 'idle',
  REQUESTING = 'requesting',
  WAITING = 'waiting',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}
```

## Integration with Jitsi Meet

### Jitsi Meet Integration

The component is designed to work alongside Jitsi Meet. Here's how to integrate it:

```tsx
import React, { useState, useEffect } from 'react';
import RemoteAccessComponent from './RemoteAccessComponent';

function JitsiMeetIntegration() {
  const [participants, setParticipants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Listen to Jitsi Meet events
  useEffect(() => {
    // This would be your Jitsi Meet integration
    const handleParticipantJoined = (participant) => {
      setParticipants(prev => [...prev, {
        id: participant.getId(),
        name: participant.getDisplayName(),
        role: participant.isModerator() ? 'trainer' : 'student',
        isOnline: true
      }]);
    };

    const handleParticipantLeft = (participantId) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    };

    // Set up your Jitsi Meet event listeners here
    // jitsiMeet.on('participantJoined', handleParticipantJoined);
    // jitsiMeet.on('participantLeft', handleParticipantLeft);

    return () => {
      // Clean up event listeners
    };
  }, []);

  return (
    <div className="jitsi-integration">
      {/* Jitsi Meet iframe */}
      <iframe 
        src="https://meet.jit.si/your-meeting-room"
        width="100%"
        height="600"
        frameBorder="0"
      />
      
      {/* Remote Access Component */}
      <RemoteAccessComponent
        currentUser={currentUser}
        participants={participants}
        onRequestSent={(request) => {
          // Send request via Jitsi Meet data channel
          // jitsiMeet.sendDataMessage(request.targetId, 'remote-access-request', request);
        }}
      />
    </div>
  );
}
```

### Backend Integration

For a complete solution, you'll need to implement backend endpoints:

```typescript
// Example backend endpoints (Node.js/Express)

// Send remote access request
app.post('/api/remote-access/request', async (req, res) => {
  const { requesterId, targetId, accessType } = req.body;
  
  // Store request in database
  const request = await db.remoteAccessRequests.create({
    requesterId,
    targetId,
    accessType,
    status: 'waiting',
    timestamp: new Date()
  });
  
  // Send notification to target user
  await sendNotification(targetId, {
    type: 'remote-access-request',
    data: request
  });
  
  res.json(request);
});

// Accept remote access request
app.post('/api/remote-access/accept', async (req, res) => {
  const { requestId } = req.body;
  
  // Generate access credentials
  const accessData = generateAccessCredentials(req.body.accessType);
  
  // Update request status
  await db.remoteAccessRequests.update(requestId, {
    status: 'accepted',
    accessData
  });
  
  // Log audit event
  await logAuditEvent('remote-access-accepted', {
    requestId,
    acceptorId: req.user.id
  });
  
  res.json({ success: true, accessData });
});
```

## Customization

### Custom Translations

```tsx
const customTranslations = {
  'remoteAccess.title.trainer': 'Remote Support - Trainer',
  'remoteAccess.title.student': 'Remote Support - Student',
  'remoteAccess.requestButton': 'Request Screen Share',
  'remoteAccess.instructions.trainer': 'Click to request remote access to help students with technical issues.',
  // ... more translations
};

<RemoteAccessComponent
  currentUser={currentUser}
  participants={participants}
  translations={customTranslations}
/>
```

### Custom Styling

You can customize the appearance by overriding CSS classes:

```css
/* Custom styles */
.remote-access-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.request-button {
  background-color: #ff6b6b;
  border-radius: 25px;
}

.status-accepted {
  background-color: #51cf66;
  color: white;
}
```

## Security Considerations

### Best Practices

1. **Authentication**: Always verify user permissions before allowing remote access requests
2. **Audit Logging**: Log all remote access events for compliance
3. **Timeouts**: Implement request timeouts to prevent hanging requests
4. **Encryption**: Use secure channels for transmitting access credentials
5. **User Consent**: Ensure users explicitly consent to remote access

### Implementation Example

```typescript
// Security middleware
const requireRemoteAccessPermission = (req, res, next) => {
  const { targetId } = req.body;
  const requesterId = req.user.id;
  
  // Check if requester has permission to request access
  if (!hasPermission(requesterId, 'request-remote-access', targetId)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Check if target user has enabled remote access
  if (!isRemoteAccessEnabled(targetId)) {
    return res.status(400).json({ error: 'Remote access not enabled' });
  }
  
  next();
};

// Rate limiting
const rateLimit = require('express-rate-limit');
const remoteAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many remote access requests'
});

app.use('/api/remote-access', remoteAccessLimiter);
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@yourcompany.com
- Documentation: https://docs.yourcompany.com/remote-access

## Changelog

### v1.0.0
- Initial release
- Support for RustDesk, Chrome Remote Desktop, and AnyDesk
- Role-based access control
- Real-time status updates
- Audit logging
- Responsive design
- Dark mode support
# jitsi-server
