import { AnyAction } from 'redux';

import { REMOTE_ACCESS_ACTIONS, RemoteAccessStatus } from './constants';

/**
 * The type of the remote access request state.
 */
interface IRemoteAccessRequest {
    status: RemoteAccessStatus;
    accessType?: string;
    timestamp?: number;
    data?: {
        sessionId: string;
        id: string;
        password: string;
        type: string;
    };
}

/**
 * The type of the remote access feature state.
 */
interface IRemoteAccessState {
    requests: {
        [participantId: string]: IRemoteAccessRequest;
    };
    isEnabled: boolean;
}

/**
 * Initial state for the remote access feature.
 */
const initialState: IRemoteAccessState = {
    requests: {},
    isEnabled: true
};

/**
 * Reduces Redux actions for the remote access feature.
 *
 * @param {IRemoteAccessState} state - The current state.
 * @param {AnyAction} action - The action to reduce.
 * @returns {IRemoteAccessState} The new state.
 */
export default function remoteAccessReducer(state = initialState, action: AnyAction): IRemoteAccessState {
    switch (action.type) {
        case REMOTE_ACCESS_ACTIONS.REQUEST_ACCESS: {
            const { participantId, accessType, timestamp } = action;

            return {
                ...state,
                requests: {
                    ...state.requests,
                    [participantId]: {
                        status: RemoteAccessStatus.REQUESTING,
                        accessType,
                        timestamp
                    }
                }
            };
        }

        case REMOTE_ACCESS_ACTIONS.ACCEPT_ACCESS: {
            const { participantId, accessType, accessData, timestamp } = action;

            return {
                ...state,
                requests: {
                    ...state.requests,
                    [participantId]: {
                        status: RemoteAccessStatus.ACCEPTED,
                        accessType,
                        timestamp,
                        data: accessData
                    }
                }
            };
        }

        case REMOTE_ACCESS_ACTIONS.REJECT_ACCESS: {
            const { participantId, timestamp } = action;

            return {
                ...state,
                requests: {
                    ...state.requests,
                    [participantId]: {
                        status: RemoteAccessStatus.REJECTED,
                        timestamp
                    }
                }
            };
        }

        case REMOTE_ACCESS_ACTIONS.CANCEL_ACCESS: {
            const { participantId, timestamp } = action;

            return {
                ...state,
                requests: {
                    ...state.requests,
                    [participantId]: {
                        status: RemoteAccessStatus.CANCELLED,
                        timestamp
                    }
                }
            };
        }

        case REMOTE_ACCESS_ACTIONS.UPDATE_STATUS: {
            const { participantId, status } = action;

            return {
                ...state,
                requests: {
                    ...state.requests,
                    [participantId]: {
                        ...state.requests[participantId],
                        status
                    }
                }
            };
        }

        case REMOTE_ACCESS_ACTIONS.SET_ACCESS_DATA: {
            const { participantId, data } = action;

            return {
                ...state,
                requests: {
                    ...state.requests,
                    [participantId]: {
                        ...state.requests[participantId],
                        data
                    }
                }
            };
        }

        case REMOTE_ACCESS_ACTIONS.CLEAR_REQUEST: {
            const { participantId } = action;
            const newRequests = { ...state.requests };

            delete newRequests[participantId];

            return {
                ...state,
                requests: newRequests
            };
        }

        default:
            return state;
    }
} 