import { sendAnalytics } from '../analytics/functions';
import { IStore } from '../app/types';
import { getLocalParticipant, getParticipantById } from '../base/participants/functions';

import { REMOTE_ACCESS_ACTIONS, REMOTE_ACCESS_AUDIT_EVENTS, RemoteAccessStatus, RemoteAccessType } from './constants';

/**
 * Action to request remote access from a participant.
 *
 * @param {string} participantId - The ID of the participant to request access from.
 * @param {RemoteAccessType} accessType - The type of remote access to request.
 * @returns {Function} Redux thunk action.
 */
export const requestRemoteAccess = (participantId: string, accessType: RemoteAccessType = RemoteAccessType.RUSTDESK) => {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const participant = getParticipantById(state, participantId);
        const localParticipant = getLocalParticipant(state);
        
        if (!participant) {
            console.warn('Remote access request failed: Participant not found', participantId);
            return;
        }
        
        // Log the request
        sendAnalytics({
            action: REMOTE_ACCESS_AUDIT_EVENTS.REQUEST_SENT,
            targetParticipantId: participantId,
            targetParticipantName: participant.name,
            accessType,
            requesterId: localParticipant?.id,
            requesterName: localParticipant?.name
        });
        
        // Send the request via Jitsi Meet's data channel or signaling
        // This would integrate with the existing Jitsi Meet infrastructure
        dispatch({
            type: REMOTE_ACCESS_ACTIONS.REQUEST_ACCESS,
            participantId,
            accessType,
            timestamp: Date.now()
        });
        
        // Set local state to waiting
        dispatch({
            type: REMOTE_ACCESS_ACTIONS.UPDATE_STATUS,
            participantId,
            status: RemoteAccessStatus.WAITING
        });
        
        // Set up timeout for the request
        setTimeout(() => {
            const currentState = getState();
            const currentRequest = currentState['features/remote-access']?.requests?.[participantId];
            
            if (currentRequest?.status === RemoteAccessStatus.WAITING) {
                dispatch({
                    type: REMOTE_ACCESS_ACTIONS.UPDATE_STATUS,
                    participantId,
                    status: RemoteAccessStatus.EXPIRED
                });
                
                sendAnalytics(REMOTE_ACCESS_AUDIT_EVENTS.REQUEST_EXPIRED, {
                    targetParticipantId: participantId,
                    accessType
                });
            }
        }, 30000); // 30 second timeout
    };
};

/**
 * Action to accept a remote access request
 */
export const acceptRemoteAccess = (participantId: string, accessType: RemoteAccessType) => {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const participant = getParticipantById(state, participantId);
        const localParticipant = getLocalParticipant(state);
        
        // Generate access credentials based on the type
        const accessData = generateAccessCredentials(accessType);
        
        // Log the acceptance
        sendAnalytics(REMOTE_ACCESS_AUDIT_EVENTS.REQUEST_ACCEPTED, {
            requesterId: participantId,
            requesterName: participant?.name,
            accessType,
            acceptorId: localParticipant?.id,
            acceptorName: localParticipant?.name
        });
        
        // Update local state
        dispatch({
            type: REMOTE_ACCESS_ACTIONS.ACCEPT_ACCESS,
            participantId,
            accessType,
            accessData,
            timestamp: Date.now()
        });
        
        // Send acceptance to the requester via Jitsi Meet signaling
        // This would integrate with the existing Jitsi Meet infrastructure
        
        // Log session start
        sendAnalytics(REMOTE_ACCESS_AUDIT_EVENTS.SESSION_STARTED, {
            requesterId: participantId,
            accessType,
            sessionId: accessData.sessionId
        });
    };
};

/**
 * Action to reject a remote access request
 */
export const rejectRemoteAccess = (participantId: string) => {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const participant = getParticipantById(state, participantId);
        const localParticipant = getLocalParticipant(state);
        
        // Log the rejection
        sendAnalytics(REMOTE_ACCESS_AUDIT_EVENTS.REQUEST_REJECTED, {
            requesterId: participantId,
            requesterName: participant?.name,
            rejectorId: localParticipant?.id,
            rejectorName: localParticipant?.name
        });
        
        // Update local state
        dispatch({
            type: REMOTE_ACCESS_ACTIONS.REJECT_ACCESS,
            participantId,
            timestamp: Date.now()
        });
        
        // Send rejection to the requester via Jitsi Meet signaling
        // This would integrate with the existing Jitsi Meet infrastructure
    };
};

/**
 * Action to cancel a remote access request
 */
export const cancelRemoteAccess = (participantId: string) => {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const participant = getParticipantById(state, participantId);
        const localParticipant = getLocalParticipant(state);
        
        // Log the cancellation
        sendAnalytics(REMOTE_ACCESS_AUDIT_EVENTS.REQUEST_CANCELLED, {
            targetParticipantId: participantId,
            targetParticipantName: participant?.name,
            cancellerId: localParticipant?.id,
            cancellerName: localParticipant?.name
        });
        
        // Update local state
        dispatch({
            type: REMOTE_ACCESS_ACTIONS.CANCEL_ACCESS,
            participantId,
            timestamp: Date.now()
        });
        
        // Send cancellation to the target via Jitsi Meet signaling
        // This would integrate with the existing Jitsi Meet infrastructure
    };
};

/**
 * Action to clear a remote access request
 */
export const clearRemoteAccessRequest = (participantId: string) => {
    return {
        type: REMOTE_ACCESS_ACTIONS.CLEAR_REQUEST,
        participantId
    };
};

/**
 * Action to end a remote access session
 */
export const endRemoteAccessSession = (participantId: string) => {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const request = state['features/remote-access']?.requests?.[participantId];
        
        if (request?.status === RemoteAccessStatus.ACCEPTED) {
            // Log session end
            sendAnalytics(REMOTE_ACCESS_AUDIT_EVENTS.SESSION_ENDED, {
                participantId,
                accessType: request.accessType,
                sessionDuration: Date.now() - (request.timestamp || 0)
            });
        }
        
        // Clear the request
        dispatch(clearRemoteAccessRequest(participantId));
    };
};

/**
 * Helper function to generate access credentials based on the remote access type
 */
function generateAccessCredentials(accessType: RemoteAccessType) {
    const sessionId = generateSessionId();
    
    switch (accessType) {
        case RemoteAccessType.RUSTDESK:
            return {
                sessionId,
                id: generateRustDeskId(),
                password: generatePassword(),
                type: accessType
            };
            
        case RemoteAccessType.CHROME_RDP:
            return {
                sessionId,
                id: generateChromeRdpId(),
                password: generatePassword(),
                type: accessType
            };
            
        case RemoteAccessType.ANYDESK:
            return {
                sessionId,
                id: generateAnyDeskId(),
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

/**
 * Helper function to generate a unique session ID
 */
function generateSessionId(): string {
    return `ra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper function to generate a RustDesk ID
 */
function generateRustDeskId(): string {
    // RustDesk IDs are typically 12-digit numbers
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

/**
 * Helper function to generate a Chrome Remote Desktop ID
 */
function generateChromeRdpId(): string {
    // Chrome RDP IDs are typically 12-character alphanumeric strings
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

/**
 * Helper function to generate an AnyDesk ID
 */
function generateAnyDeskId(): string {
    // AnyDesk IDs are typically 9-digit numbers
    return Math.floor(100000000 + Math.random() * 900000000).toString();
}

/**
 * Helper function to generate a password
 */
function generatePassword(): string {
    // Generate a 6-character alphanumeric password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
} 