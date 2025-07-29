import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { getParticipantById } from '../../base/participants/functions';
import { getLocalParticipant } from '../../base/participants/functions';
import Button from '../../base/ui/components/web/Button';
import Dialog from '../../base/ui/components/web/Dialog';
import Spinner from '../../base/ui/components/web/Spinner';
import { requestRemoteAccess, acceptRemoteAccess, rejectRemoteAccess, cancelRemoteAccess } from '../actions';
import { RemoteAccessStatus, RemoteAccessType } from '../constants';

const useStyles = makeStyles((theme: any) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: theme.palette.ui01,
        borderRadius: '8px',
        border: `1px solid ${theme.palette.ui03}`,
        margin: '8px 0'
    },
    buttonContainer: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
    },
    statusContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: theme.palette.ui02
    },
    statusText: {
        fontSize: '14px',
        fontWeight: 500
    },
    waitingStatus: {
        backgroundColor: theme.palette.warning01,
        color: theme.palette.warning02
    },
    acceptedStatus: {
        backgroundColor: theme.palette.success01,
        color: theme.palette.success02
    },
    rejectedStatus: {
        backgroundColor: theme.palette.error01,
        color: theme.palette.error02
    },
    instructionsContainer: {
        backgroundColor: theme.palette.ui02,
        padding: '12px',
        borderRadius: '4px',
        marginTop: '8px'
    },
    instructionsTitle: {
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '8px',
        color: theme.palette.text01
    },
    instructionsText: {
        fontSize: '14px',
        lineHeight: '1.5',
        color: theme.palette.text02,
        marginBottom: '8px'
    },
    codeBlock: {
        backgroundColor: theme.palette.ui03,
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '13px',
        color: theme.palette.text01,
        margin: '4px 0'
    },
    link: {
        color: theme.palette.action01,
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'underline'
        }
    }
}));

interface IRemoteAccessRequestProps {
    /**
     * The ID of the participant to request remote access from
     */
    participantId: string;
    
    /**
     * The type of remote access to request (RustDesk, Chrome Remote Desktop, AnyDesk)
     */
    accessType?: RemoteAccessType;
    
    /**
     * Custom instructions to show when access is granted
     */
    customInstructions?: string;
    
    /**
     * Whether the current user is a trainer/instructor
     */
    isTrainer?: boolean;
    
    /**
     * Invoked to obtain translated strings
     */
    t: Function;
}

/**
 * React component for requesting and managing remote access in an EdTech LMS platform
 */
const RemoteAccessRequest: React.FC<IRemoteAccessRequestProps> = ({
    participantId,
    accessType = RemoteAccessType.RUSTDESK,
    customInstructions,
    isTrainer = false,
    t
}) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    
    const participant = useSelector((state: IReduxState) => 
        getParticipantById(state, participantId)
    );
    const localParticipant = useSelector((state: IReduxState) => 
        getLocalParticipant(state)
    );
    
    // Get remote access state from Redux store
    const remoteAccessState = useSelector((state: IReduxState) => 
        state['features/remote-access']?.requests?.[participantId]
    );
    
    const [showRequestDialog, setShowRequestDialog] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    
    const isLocalUser = localParticipant?.id === participantId;
    const isRequesting = remoteAccessState?.status === RemoteAccessStatus.REQUESTING;
    const isWaiting = remoteAccessState?.status === RemoteAccessStatus.WAITING;
    const isAccepted = remoteAccessState?.status === RemoteAccessStatus.ACCEPTED;
    const isRejected = remoteAccessState?.status === RemoteAccessStatus.REJECTED;
    
    // Auto-show instructions when access is accepted
    useEffect(() => {
        if (isAccepted && isTrainer) {
            setShowInstructions(true);
        }
    }, [isAccepted, isTrainer]);
    
    const handleRequestAccess = useCallback(() => {
        if (isLocalUser) {
            // Show request dialog for local user
            setShowRequestDialog(true);
        } else {
            // Send request to remote participant
            dispatch(requestRemoteAccess(participantId, accessType));
        }
    }, [dispatch, participantId, accessType, isLocalUser]);
    
    const handleAcceptRequest = useCallback(() => {
        dispatch(acceptRemoteAccess(participantId, accessType));
        setShowRequestDialog(false);
    }, [dispatch, participantId, accessType]);
    
    const handleRejectRequest = useCallback(() => {
        dispatch(rejectRemoteAccess(participantId));
        setShowRequestDialog(false);
    }, [dispatch, participantId]);
    
    const handleCancelRequest = useCallback(() => {
        dispatch(cancelRemoteAccess(participantId));
    }, [dispatch, participantId]);
    
    const getStatusText = () => {
        if (isRequesting) return t('remoteAccess.requesting');
        if (isWaiting) return t('remoteAccess.waitingForApproval');
        if (isAccepted) return t('remoteAccess.accessGranted');
        if (isRejected) return t('remoteAccess.accessDenied');
        return '';
    };
    
    const getStatusClass = () => {
        if (isWaiting) return classes.waitingStatus;
        if (isAccepted) return classes.acceptedStatus;
        if (isRejected) return classes.rejectedStatus;
        return '';
    };
    
    const getInstructions = () => {
        const baseInstructions = {
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
        
        return baseInstructions[accessType];
    };
    
    const instructions = getInstructions();
    const remoteAccessData = remoteAccessState?.data;
    
    return (
        <div className={classes.container}>
            {/* Request Button */}
            {!isRequesting && !isWaiting && !isAccepted && (
                <Button
                    accessibilityLabel={t('remoteAccess.requestButton')}
                    label={t('remoteAccess.requestButton')}
                    onClick={handleRequestAccess}
                    size="medium"
                    type="primary"
                />
            )}
            
            {/* Status Display */}
            {(isRequesting || isWaiting || isAccepted || isRejected) && (
                <div className={`${classes.statusContainer} ${getStatusClass()}`}>
                    {isWaiting && <Spinner size="small" />}
                    <span className={classes.statusText}>{getStatusText()}</span>
                </div>
            )}
            
            {/* Action Buttons */}
            {isWaiting && isTrainer && (
                <div className={classes.buttonContainer}>
                    <Button
                        accessibilityLabel={t('remoteAccess.cancelButton')}
                        label={t('remoteAccess.cancelButton')}
                        onClick={handleCancelRequest}
                        size="small"
                        type="secondary"
                    />
                </div>
            )}
            
            {/* Instructions Dialog */}
            {showInstructions && isAccepted && (
                <Dialog
                    cancelKey={t('dialog.close')}
                    onCancel={() => setShowInstructions(false)}
                    titleKey={instructions.title}
                    width="medium"
                >
                    <div className={classes.instructionsContainer}>
                        {instructions.steps.map((step, index) => (
                            <div key={index} className={classes.instructionsText}>
                                {index + 1}. {step}
                            </div>
                        ))}
                        
                        {customInstructions && (
                            <div className={classes.instructionsText}>
                                <strong>{t('remoteAccess.customInstructions')}:</strong>
                                <br />
                                {customInstructions}
                            </div>
                        )}
                        
                        <div className={classes.instructionsText}>
                            <strong>{t('remoteAccess.downloadLink')}:</strong>
                            <br />
                            <a 
                                href={instructions.downloadUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={classes.link}
                            >
                                {instructions.downloadUrl}
                            </a>
                        </div>
                        
                        {remoteAccessData && (
                            <>
                                <div className={classes.instructionsText}>
                                    <strong>{instructions.idLabel}:</strong>
                                    <div className={classes.codeBlock}>
                                        {remoteAccessData.id}
                                    </div>
                                </div>
                                
                                <div className={classes.instructionsText}>
                                    <strong>{instructions.passwordLabel}:</strong>
                                    <div className={classes.codeBlock}>
                                        {remoteAccessData.password}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Dialog>
            )}
            
            {/* Request Dialog */}
            {showRequestDialog && (
                <Dialog
                    cancelKey={t('dialog.reject')}
                    okKey={t('dialog.accept')}
                    onCancel={handleRejectRequest}
                    onSubmit={handleAcceptRequest}
                    titleKey={t('remoteAccess.requestDialog.title')}
                    width="small"
                >
                    <div>
                        {t('remoteAccess.requestDialog.message', {
                            trainer: participant?.name || t('remoteAccess.unknownUser'),
                            type: t(`remoteAccess.types.${accessType}`)
                        })}
                    </div>
                </Dialog>
            )}
        </div>
    );
};

export default translate(RemoteAccessRequest); 