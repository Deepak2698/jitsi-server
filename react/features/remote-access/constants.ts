/**
 * Remote access status constants
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
 * Remote access type constants
 */
export enum RemoteAccessType {
    RUSTDESK = 'rustdesk',
    CHROME_RDP = 'chrome_rdp',
    ANYDESK = 'anydesk'
}

/**
 * Remote access action types
 */
export const REMOTE_ACCESS_ACTIONS = {
    REQUEST_ACCESS: 'REMOTE_ACCESS_REQUEST',
    ACCEPT_ACCESS: 'REMOTE_ACCESS_ACCEPT',
    REJECT_ACCESS: 'REMOTE_ACCESS_REJECT',
    CANCEL_ACCESS: 'REMOTE_ACCESS_CANCEL',
    UPDATE_STATUS: 'REMOTE_ACCESS_UPDATE_STATUS',
    SET_ACCESS_DATA: 'REMOTE_ACCESS_SET_DATA',
    CLEAR_REQUEST: 'REMOTE_ACCESS_CLEAR_REQUEST'
} as const;

/**
 * Remote access configuration
 */
export const REMOTE_ACCESS_CONFIG = {
    REQUEST_TIMEOUT: 30000, // 30 seconds
    SESSION_TIMEOUT: 3600000, // 1 hour
    MAX_CONCURRENT_REQUESTS: 5,
    SUPPORTED_TYPES: [
        RemoteAccessType.RUSTDESK,
        RemoteAccessType.CHROME_RDP,
        RemoteAccessType.ANYDESK
    ]
} as const;

/**
 * Remote access URLs and schemes
 */
export const REMOTE_ACCESS_URLS = {
    [RemoteAccessType.RUSTDESK]: {
        download: 'https://rustdesk.com/download',
        scheme: 'rustdesk://',
        instructions: 'https://rustdesk.com/docs/en/get-started/'
    },
    [RemoteAccessType.CHROME_RDP]: {
        download: 'https://remotedesktop.google.com/',
        scheme: 'chrome-remote-desktop://',
        instructions: 'https://support.google.com/chrome/answer/1649523'
    },
    [RemoteAccessType.ANYDESK]: {
        download: 'https://anydesk.com/download',
        scheme: 'anydesk://',
        instructions: 'https://support.anydesk.com/'
    }
} as const;

/**
 * Remote access audit log events
 */
export const REMOTE_ACCESS_AUDIT_EVENTS = {
    REQUEST_SENT: 'remote_access_request_sent',
    REQUEST_RECEIVED: 'remote_access_request_received',
    REQUEST_ACCEPTED: 'remote_access_request_accepted',
    REQUEST_REJECTED: 'remote_access_request_rejected',
    REQUEST_CANCELLED: 'remote_access_request_cancelled',
    REQUEST_EXPIRED: 'remote_access_request_expired',
    SESSION_STARTED: 'remote_access_session_started',
    SESSION_ENDED: 'remote_access_session_ended'
} as const; 