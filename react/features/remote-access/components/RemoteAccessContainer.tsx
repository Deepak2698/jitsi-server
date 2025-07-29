import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { getParticipants } from '../../base/participants/functions';
import { getLocalParticipant } from '../../base/participants/functions';
import { isModerator } from '../../base/participants/functions';
import Button from '../../base/ui/components/web/Button';
import Select from '../../base/ui/components/web/Select';
import RemoteAccessRequest from './RemoteAccessRequest';
import { RemoteAccessType } from '../constants';

const useStyles = makeStyles((theme: any) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        backgroundColor: theme.palette.ui01,
        borderRadius: '12px',
        border: `1px solid ${theme.palette.ui03}`,
        maxWidth: '400px',
        minHeight: '200px'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
    },
    title: {
        fontSize: '18px',
        fontWeight: 600,
        color: theme.palette.text01,
        margin: 0
    },
    subtitle: {
        fontSize: '14px',
        color: theme.palette.text02,
        margin: '4px 0 0 0'
    },
    controlsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    selectContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    selectLabel: {
        fontSize: '14px',
        fontWeight: 500,
        color: theme.palette.text01
    },
    participantList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxHeight: '300px',
        overflowY: 'auto'
    },
    participantItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: theme.palette.ui02,
        borderRadius: '6px',
        border: `1px solid ${theme.palette.ui03}`
    },
    participantInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    participantName: {
        fontSize: '14px',
        fontWeight: 500,
        color: theme.palette.text01
    },
    participantRole: {
        fontSize: '12px',
        color: theme.palette.text02
    },
    noParticipants: {
        textAlign: 'center',
        padding: '20px',
        color: theme.palette.text02,
        fontSize: '14px'
    },
    instructions: {
        backgroundColor: theme.palette.ui02,
        padding: '12px',
        borderRadius: '6px',
        fontSize: '13px',
        color: theme.palette.text02,
        lineHeight: '1.4'
    }
}));

interface IRemoteAccessContainerProps {
    /**
     * Whether the component is visible
     */
    isVisible?: boolean;
    
    /**
     * Custom instructions for remote access
     */
    customInstructions?: string;
    
    /**
     * Invoked to obtain translated strings
     */
    t: Function;
}

/**
 * Container component for remote access functionality in an EdTech LMS platform
 */
const RemoteAccessContainer: React.FC<IRemoteAccessContainerProps> = ({
    isVisible = true,
    customInstructions,
    t
}) => {
    const classes = useStyles();
    
    const participants = useSelector((state: IReduxState) => getParticipants(state));
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const isLocalModerator = useSelector((state: IReduxState) => isModerator(state));
    
    const [selectedParticipant, setSelectedParticipant] = useState<string>('');
    const [selectedAccessType, setSelectedAccessType] = useState<RemoteAccessType>(RemoteAccessType.RUSTDESK);
    
    // Filter out local participant and only show students for trainers
    const availableParticipants = participants.filter(participant => {
        if (participant.id === localParticipant?.id) {
            return false; // Don't show local participant
        }
        
        if (isLocalModerator) {
            // Trainers can request access from students
            return !isModerator({ participants: [participant] });
        } else {
            // Students can only see other students (for peer-to-peer help)
            return !isModerator({ participants: [participant] });
        }
    });
    
    // Auto-select first participant if none selected
    useEffect(() => {
        if (!selectedParticipant && availableParticipants.length > 0) {
            setSelectedParticipant(availableParticipants[0].id);
        }
    }, [selectedParticipant, availableParticipants]);
    
    const handleParticipantChange = useCallback((participantId: string) => {
        setSelectedParticipant(participantId);
    }, []);
    
    const handleAccessTypeChange = useCallback((accessType: RemoteAccessType) => {
        setSelectedAccessType(accessType);
    }, []);
    
    const getParticipantOptions = () => {
        return availableParticipants.map(participant => ({
            value: participant.id,
            label: participant.name || t('remoteAccess.unknownUser'),
            secondaryLabel: isModerator({ participants: [participant] }) 
                ? t('remoteAccess.role.moderator') 
                : t('remoteAccess.role.participant')
        }));
    };
    
    const getAccessTypeOptions = () => {
        return [
            {
                value: RemoteAccessType.RUSTDESK,
                label: t('remoteAccess.types.rustdesk')
            },
            {
                value: RemoteAccessType.CHROME_RDP,
                label: t('remoteAccess.types.chrome_rdp')
            },
            {
                value: RemoteAccessType.ANYDESK,
                label: t('remoteAccess.types.anydesk')
            }
        ];
    };
    
    if (!isVisible) {
        return null;
    }
    
    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <div>
                    <h3 className={classes.title}>
                        {isLocalModerator 
                            ? t('remoteAccess.title.trainer') 
                            : t('remoteAccess.title.student')
                        }
                    </h3>
                    <p className={classes.subtitle}>
                        {isLocalModerator 
                            ? t('remoteAccess.subtitle.trainer') 
                            : t('remoteAccess.subtitle.student')
                        }
                    </p>
                </div>
            </div>
            
            <div className={classes.controlsContainer}>
                {/* Participant Selection */}
                <div className={classes.selectContainer}>
                    <label className={classes.selectLabel}>
                        {t('remoteAccess.selectParticipant')}
                    </label>
                    <Select
                        onChange={handleParticipantChange}
                        options={getParticipantOptions()}
                        value={selectedParticipant}
                        placeholder={t('remoteAccess.selectParticipantPlaceholder')}
                    />
                </div>
                
                {/* Access Type Selection */}
                <div className={classes.selectContainer}>
                    <label className={classes.selectLabel}>
                        {t('remoteAccess.selectAccessType')}
                    </label>
                    <Select
                        onChange={handleAccessTypeChange}
                        options={getAccessTypeOptions()}
                        value={selectedAccessType}
                        placeholder={t('remoteAccess.selectAccessTypePlaceholder')}
                    />
                </div>
                
                {/* Remote Access Request Component */}
                {selectedParticipant && (
                    <RemoteAccessRequest
                        participantId={selectedParticipant}
                        accessType={selectedAccessType}
                        customInstructions={customInstructions}
                        isTrainer={isLocalModerator}
                        t={t}
                    />
                )}
                
                {/* Instructions */}
                <div className={classes.instructions}>
                    <strong>{t('remoteAccess.instructions.title')}:</strong>
                    <br />
                    {isLocalModerator 
                        ? t('remoteAccess.instructions.trainer')
                        : t('remoteAccess.instructions.student')
                    }
                </div>
            </div>
        </div>
    );
};

export default translate(RemoteAccessContainer); 