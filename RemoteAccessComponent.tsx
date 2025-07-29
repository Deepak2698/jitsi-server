import React, { useState, useCallback, useEffect } from 'react';
import './RemoteAccessComponent.css';

/**
 * Remote access types supported by the component
 */
export enum RemoteAccessType {
    RUSTDESK = 'rustdesk',
    CHROME_RDP = 'chrome_rdp',
    ANYDESK = 'anydesk'
}

/**
 * Remote access request status
 */
export enum RemoteAccessStatus {
    IDLE = 'idle',
    REQUESTING = 'requesting',
    WAITING = 'waiting',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired'
}

/**
 * Participant interface
 */
interface Participant {
    id: string;
    name: string;
    role: 'trainer' | 'student';
    isOnline: boolean;
}

/**
 * Remote access request interface
 */
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

/**
 * Props for the RemoteAccessComponent
 */
interface RemoteAccessComponentProps {
    /**
     * Current user information
     */
    currentUser: {
        id: string;
        name: string;
        role: 'trainer' | 'student';
    };
    
    /**
     * List of participants in the session
     */
    participants: Participant[];
    
    /**
     * Whether the component is visible
     */
    isVisible?: boolean;
    
    /**
     * Custom instructions for remote access
     */
    customInstructions?: string;
    
    /**
     * Callback when a remote access request is sent
     */
    onRequestSent?: (request: RemoteAccessRequest) => void;
    
    /**
     * Callback when a remote access request is received
     */
    onRequestReceived?: (request: RemoteAccessRequest) => void;
    
    /**
     * Callback when a remote access request is accepted
     */
    onRequestAccepted?: (request: RemoteAccessRequest) => void;
    
    /**
     * Callback when a remote access request is rejected
     */
    onRequestRejected?: (request: RemoteAccessRequest) => void;
    
    /**
     * Callback when a remote access request is cancelled
     */
    onRequestCancelled?: (request: RemoteAccessRequest) => void;
    
    /**
     * Custom translations
     */
    translations?: {
        [key: string]: string;
    };
}

/**
 * Remote Access Component for EdTech LMS platforms
 * 
 * This component provides remote access functionality for trainers to request
 * access to students' computers and for students to accept/reject these requests.
 * It supports multiple remote access tools like RustDesk, Chrome Remote Desktop, and AnyDesk.
 */
const RemoteAccessComponent: React.FC<RemoteAccessComponentProps> = ({
    currentUser,
    participants,
    isVisible = true,
    customInstructions,
    onRequestSent,
    onRequestReceived,
    onRequestAccepted,
    onRequestRejected,
    onRequestCancelled,
    translations = {}
}) => {
    const [selectedParticipant, setSelectedParticipant] = useState<string>('');
    const [selectedAccessType, setSelectedAccessType] = useState<RemoteAccessType>(RemoteAccessType.RUSTDESK);
    const [requests, setRequests] = useState<RemoteAccessRequest[]>([]);
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [pendingRequest, setPendingRequest] = useState<RemoteAccessRequest | null>(null);

    // Default translations
    const t = useCallback((key: string, params?: any) => {
        const translation = translations[key] || getDefaultTranslation(key);
        if (params) {
            return Object.keys(params).reduce((str, param) => {
                return str.replace(`{${param}}`, params[param]);
            }, translation);
        }
        return translation;
    }, [translations]);

    // Filter available participants based on user role
    const availableParticipants = participants.filter(participant => {
        if (participant.id === currentUser.id) {
            return false; // Don't show current user
        }
        
        if (currentUser.role === 'trainer') {
            // Trainers can request access from students
            return participant.role === 'student' && participant.isOnline;
        } else {
            // Students can only see other students (for peer-to-peer help)
            return participant.role === 'student' && participant.isOnline;
        }
    });

    // Auto-select first participant if none selected
    useEffect(() => {
        if (!selectedParticipant && availableParticipants.length > 0) {
            setSelectedParticipant(availableParticipants[0].id);
        }
    }, [selectedParticipant, availableParticipants]);

    // Handle request timeout
    useEffect(() => {
        const timeoutIds: NodeJS.Timeout[] = [];
        
        requests.forEach(request => {
            if (request.status === RemoteAccessStatus.WAITING) {
                const timeoutId = setTimeout(() => {
                    updateRequestStatus(request.id, RemoteAccessStatus.EXPIRED);
                }, 30000); // 30 second timeout
                timeoutIds.push(timeoutId);
            }
        });

        return () => {
            timeoutIds.forEach(id => clearTimeout(id));
        };
    }, [requests]);

    const handleRequestAccess = useCallback(() => {
        if (!selectedParticipant) return;

        const targetParticipant = participants.find(p => p.id === selectedParticipant);
        if (!targetParticipant) return;

        const request: RemoteAccessRequest = {
            id: generateRequestId(),
            requesterId: currentUser.id,
            targetId: selectedParticipant,
            accessType: selectedAccessType,
            status: RemoteAccessStatus.REQUESTING,
            timestamp: Date.now()
        };

        setRequests(prev => [...prev, request]);
        onRequestSent?.(request);

        // Simulate sending request to target participant
        setTimeout(() => {
            updateRequestStatus(request.id, RemoteAccessStatus.WAITING);
            onRequestReceived?.({ ...request, status: RemoteAccessStatus.WAITING });
        }, 1000);
    }, [selectedParticipant, selectedAccessType, currentUser.id, participants, onRequestSent, onRequestReceived]);

    const handleAcceptRequest = useCallback((requestId: string) => {
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        const accessData = generateAccessCredentials(request.accessType);
        const updatedRequest = {
            ...request,
            status: RemoteAccessStatus.ACCEPTED,
            accessData
        };

        updateRequestStatus(requestId, RemoteAccessStatus.ACCEPTED, accessData);
        onRequestAccepted?.(updatedRequest);
        setShowRequestDialog(false);
        setPendingRequest(null);

        // Auto-show instructions for trainers
        if (currentUser.role === 'trainer') {
            setShowInstructions(true);
        }
    }, [requests, currentUser.role, onRequestAccepted]);

    const handleRejectRequest = useCallback((requestId: string) => {
        updateRequestStatus(requestId, RemoteAccessStatus.REJECTED);
        onRequestRejected?.(requests.find(r => r.id === requestId)!);
        setShowRequestDialog(false);
        setPendingRequest(null);
    }, [requests, onRequestRejected]);

    const handleCancelRequest = useCallback((requestId: string) => {
        updateRequestStatus(requestId, RemoteAccessStatus.CANCELLED);
        onRequestCancelled?.(requests.find(r => r.id === requestId)!);
    }, [requests, onRequestCancelled]);

    const updateRequestStatus = useCallback((requestId: string, status: RemoteAccessStatus, accessData?: any) => {
        setRequests(prev => prev.map(request => 
            request.id === requestId 
                ? { ...request, status, ...(accessData && { accessData }) }
                : request
        ));
    }, []);

    const getCurrentRequest = useCallback((participantId: string) => {
        return requests.find(r => 
            (r.requesterId === currentUser.id && r.targetId === participantId) ||
            (r.targetId === currentUser.id && r.requesterId === participantId)
        );
    }, [requests, currentUser.id]);

    const getInstructions = useCallback((accessType: RemoteAccessType) => {
        const instructions = {
            [RemoteAccessType.RUSTDESK]: {
                title: t('remoteAccess.rustDesk.title'),
                steps: [
                    t('remoteAccess.rustDesk.step1'),
                    t('remoteAccess.rustDesk.step2'),
                    t('remoteAccess.rustDesk.step3')
                ],
                downloadUrl: 'https://rustdesk.com/download',
                idLabel: t('remoteAccess.rustDesk.idLabel'),
                passwordLabel: t('remoteAccess.rustDesk.passwordLabel')
            },
            [RemoteAccessType.CHROME_RDP]: {
                title: t('remoteAccess.chromeRdp.title'),
                steps: [
                    t('remoteAccess.chromeRdp.step1'),
                    t('remoteAccess.chromeRdp.step2'),
                    t('remoteAccess.chromeRdp.step3')
                ],
                downloadUrl: 'https://remotedesktop.google.com/',
                idLabel: t('remoteAccess.chromeRdp.idLabel'),
                passwordLabel: t('remoteAccess.chromeRdp.passwordLabel')
            },
            [RemoteAccessType.ANYDESK]: {
                title: t('remoteAccess.anyDesk.title'),
                steps: [
                    t('remoteAccess.anyDesk.step1'),
                    t('remoteAccess.anyDesk.step2'),
                    t('remoteAccess.anyDesk.step3')
                ],
                downloadUrl: 'https://anydesk.com/download',
                idLabel: t('remoteAccess.anyDesk.idLabel'),
                passwordLabel: t('remoteAccess.anyDesk.passwordLabel')
            }
        };
        
        return instructions[accessType];
    }, [t]);

    if (!isVisible) {
        return null;
    }

    const currentRequest = selectedParticipant ? getCurrentRequest(selectedParticipant) : null;
    const isRequesting = currentRequest?.status === RemoteAccessStatus.REQUESTING;
    const isWaiting = currentRequest?.status === RemoteAccessStatus.WAITING;
    const isAccepted = currentRequest?.status === RemoteAccessStatus.ACCEPTED;
    const isRejected = currentRequest?.status === RemoteAccessStatus.REJECTED;

    return (
        <div className="remote-access-container">
            <div className="remote-access-header">
                <h3 className="remote-access-title">
                    {currentUser.role === 'trainer' 
                        ? t('remoteAccess.title.trainer') 
                        : t('remoteAccess.title.student')
                    }
                </h3>
                <p className="remote-access-subtitle">
                    {currentUser.role === 'trainer' 
                        ? t('remoteAccess.subtitle.trainer') 
                        : t('remoteAccess.subtitle.student')
                    }
                </p>
            </div>

            <div className="remote-access-controls">
                {/* Participant Selection */}
                <div className="select-container">
                    <label className="select-label">
                        {t('remoteAccess.selectParticipant')}
                    </label>
                    <select
                        value={selectedParticipant}
                        onChange={(e) => setSelectedParticipant(e.target.value)}
                        className="select-input"
                    >
                        <option value="">{t('remoteAccess.selectParticipantPlaceholder')}</option>
                        {availableParticipants.map(participant => (
                            <option key={participant.id} value={participant.id}>
                                {participant.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Access Type Selection */}
                <div className="select-container">
                    <label className="select-label">
                        {t('remoteAccess.selectAccessType')}
                    </label>
                    <select
                        value={selectedAccessType}
                        onChange={(e) => setSelectedAccessType(e.target.value as RemoteAccessType)}
                        className="select-input"
                    >
                        <option value={RemoteAccessType.RUSTDESK}>
                            {t('remoteAccess.types.rustdesk')}
                        </option>
                        <option value={RemoteAccessType.CHROME_RDP}>
                            {t('remoteAccess.types.chrome_rdp')}
                        </option>
                        <option value={RemoteAccessType.ANYDESK}>
                            {t('remoteAccess.types.anydesk')}
                        </option>
                    </select>
                </div>

                {/* Request Button */}
                {selectedParticipant && !isRequesting && !isWaiting && !isAccepted && (
                    <button
                        onClick={handleRequestAccess}
                        className="request-button"
                        disabled={!selectedParticipant}
                    >
                        {t('remoteAccess.requestButton')}
                    </button>
                )}

                {/* Status Display */}
                {(isRequesting || isWaiting || isAccepted || isRejected) && (
                    <div className={`status-container ${getStatusClass(currentRequest?.status)}`}>
                        {isWaiting && <div className="spinner"></div>}
                        <span className="status-text">{getStatusText(currentRequest?.status)}</span>
                    </div>
                )}

                {/* Action Buttons */}
                {isWaiting && currentUser.role === 'trainer' && (
                    <div className="action-buttons">
                        <button
                            onClick={() => handleCancelRequest(currentRequest!.id)}
                            className="cancel-button"
                        >
                            {t('remoteAccess.cancelButton')}
                        </button>
                    </div>
                )}

                {/* Instructions */}
                <div className="instructions">
                    <strong>{t('remoteAccess.instructions.title')}:</strong>
                    <br />
                    {currentUser.role === 'trainer' 
                        ? t('remoteAccess.instructions.trainer')
                        : t('remoteAccess.instructions.student')
                    }
                </div>
            </div>

            {/* Request Dialog */}
            {showRequestDialog && pendingRequest && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>{t('remoteAccess.requestDialog.title')}</h3>
                        <p>
                            {t('remoteAccess.requestDialog.message', {
                                trainer: participants.find(p => p.id === pendingRequest.requesterId)?.name || t('remoteAccess.unknownUser'),
                                type: t(`remoteAccess.types.${pendingRequest.accessType}`)
                            })}
                        </p>
                        <div className="modal-buttons">
                            <button
                                onClick={() => handleRejectRequest(pendingRequest.id)}
                                className="reject-button"
                            >
                                {t('dialog.reject')}
                            </button>
                            <button
                                onClick={() => handleAcceptRequest(pendingRequest.id)}
                                className="accept-button"
                            >
                                {t('dialog.accept')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions Dialog */}
            {showInstructions && currentRequest?.status === RemoteAccessStatus.ACCEPTED && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>{getInstructions(currentRequest.accessType).title}</h3>
                        <div className="instructions-content">
                            {getInstructions(currentRequest.accessType).steps.map((step, index) => (
                                <div key={index} className="instruction-step">
                                    {index + 1}. {step}
                                </div>
                            ))}
                            
                            {customInstructions && (
                                <div className="custom-instructions">
                                    <strong>{t('remoteAccess.customInstructions')}:</strong>
                                    <br />
                                    {customInstructions}
                                </div>
                            )}
                            
                            <div className="download-link">
                                <strong>{t('remoteAccess.downloadLink')}:</strong>
                                <br />
                                <a 
                                    href={getInstructions(currentRequest.accessType).downloadUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="link"
                                >
                                    {getInstructions(currentRequest.accessType).downloadUrl}
                                </a>
                            </div>
                            
                            {currentRequest.accessData && (
                                <>
                                    <div className="access-data">
                                        <strong>{getInstructions(currentRequest.accessType).idLabel}:</strong>
                                        <div className="code-block">
                                            {currentRequest.accessData.id}
                                        </div>
                                    </div>
                                    
                                    <div className="access-data">
                                        <strong>{getInstructions(currentRequest.accessType).passwordLabel}:</strong>
                                        <div className="code-block">
                                            {currentRequest.accessData.password}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-buttons">
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="close-button"
                            >
                                {t('dialog.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper functions
function generateRequestId(): string {
    return `ra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateAccessCredentials(accessType: RemoteAccessType) {
    const sessionId = generateRequestId();
    
    switch (accessType) {
        case RemoteAccessType.RUSTDESK:
            return {
                sessionId,
                id: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
                password: generatePassword(),
                type: accessType
            };
            
        case RemoteAccessType.CHROME_RDP:
            return {
                sessionId,
                id: Array.from({ length: 12 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))).join(''),
                password: generatePassword(),
                type: accessType
            };
            
        case RemoteAccessType.ANYDESK:
            return {
                sessionId,
                id: Math.floor(100000000 + Math.random() * 900000000).toString(),
                password: generatePassword(),
                type: accessType
            };
            
        default:
            return {
                sessionId,
                id: 'unknown',
                password: 'unknown',
                type: accessType
            };
    }
}

function generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function getStatusText(status?: RemoteAccessStatus): string {
    switch (status) {
        case RemoteAccessStatus.REQUESTING:
            return 'Requesting...';
        case RemoteAccessStatus.WAITING:
            return 'Waiting for approval...';
        case RemoteAccessStatus.ACCEPTED:
            return 'Access granted';
        case RemoteAccessStatus.REJECTED:
            return 'Access denied';
        case RemoteAccessStatus.CANCELLED:
            return 'Request cancelled';
        case RemoteAccessStatus.EXPIRED:
            return 'Request expired';
        default:
            return '';
    }
}

function getStatusClass(status?: RemoteAccessStatus): string {
    switch (status) {
        case RemoteAccessStatus.WAITING:
            return 'status-waiting';
        case RemoteAccessStatus.ACCEPTED:
            return 'status-accepted';
        case RemoteAccessStatus.REJECTED:
            return 'status-rejected';
        default:
            return '';
    }
}

function getDefaultTranslation(key: string): string {
    const translations: { [key: string]: string } = {
        'remoteAccess.title.trainer': 'Remote Access - Trainer',
        'remoteAccess.title.student': 'Remote Access - Student',
        'remoteAccess.subtitle.trainer': 'Request remote access to help students',
        'remoteAccess.subtitle.student': 'Accept remote access requests from trainers',
        'remoteAccess.selectParticipant': 'Select Participant',
        'remoteAccess.selectParticipantPlaceholder': 'Choose a participant...',
        'remoteAccess.selectAccessType': 'Select Access Type',
        'remoteAccess.requestButton': 'Request Remote Access',
        'remoteAccess.cancelButton': 'Cancel Request',
        'remoteAccess.instructions.title': 'Instructions',
        'remoteAccess.instructions.trainer': 'Click the button above to request remote access to the selected student\'s computer.',
        'remoteAccess.instructions.student': 'You will receive a notification when a trainer requests remote access to your computer.',
        'remoteAccess.types.rustdesk': 'RustDesk',
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
        'remoteAccess.customInstructions': 'Custom Instructions',
        'remoteAccess.requestDialog.title': 'Remote Access Request',
        'remoteAccess.requestDialog.message': '{trainer} is requesting remote access to your computer using {type}. Do you want to allow this?',
        'remoteAccess.unknownUser': 'Unknown User',
        'dialog.accept': 'Accept',
        'dialog.reject': 'Reject',
        'dialog.close': 'Close'
    };
    
    return translations[key] || key;
}

export default RemoteAccessComponent; 