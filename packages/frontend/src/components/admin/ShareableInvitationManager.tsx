import React, { useState, useEffect } from 'react';
import { 
  createShareableInvitation, 
  getShareableInvitationsByChoir,
  ShareableInvitation 
} from '../../services/shareableInvitationService';
import { useUser } from '../../hooks/useUser';
import './ShareableInvitationManager.scss';

interface ShareableInvitationManagerProps {
  choirId: string;
}

const ShareableInvitationManager: React.FC<ShareableInvitationManagerProps> = ({ choirId }) => {
  const { token } = useUser();
  const [invitations, setInvitations] = useState<ShareableInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');

  const fetchInvitations = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const data = await getShareableInvitationsByChoir(choirId, token);
      setInvitations(data);
    } catch (err) {
      console.error('Failed to fetch shareable invitations:', err);
      setError('Failed to load shareable invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [choirId, token]);

  const handleCreateInvitation = async () => {
    if (!token) return;

    try {
      setCreating(true);
      setError(null);

      let expiryDate: string | undefined;
      if (expiryDays && expiryDays > 0) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + expiryDays);
        expiryDate = expiry.toISOString();
      }

      const newInvitation = await createShareableInvitation({
        choirId,
        expiryDate,
        maxUses: maxUses && maxUses > 0 ? maxUses : undefined,
      }, token);

      setInvitations(prev => [newInvitation, ...prev]);
      setShowCreateForm(false);
      setExpiryDays('');
      setMaxUses('');
    } catch (err: any) {
      setError(err.message || 'Failed to create shareable invitation');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      const fullUrl = `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      // You could add a toast notification here
      alert('¡Enlace copiado al portapapeles!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Error al copiar el enlace');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (invitation: ShareableInvitation) => {
    if (!invitation.expiryDate) return false;
    return new Date(invitation.expiryDate) < new Date();
  };

  const isMaxUsesReached = (invitation: ShareableInvitation) => {
    if (!invitation.maxUses) return false;
    return invitation.currentUses >= invitation.maxUses;
  };

  const getInvitationStatus = (invitation: ShareableInvitation) => {
    if (!invitation.isActive) return { text: 'Desactivado', class: 'is-dark' };
    if (isExpired(invitation)) return { text: 'Expirado', class: 'is-danger' };
    if (isMaxUsesReached(invitation)) return { text: 'Límite alcanzado', class: 'is-warning' };
    return { text: 'Activo', class: 'is-success' };
  };

  return (
    <div className="shareable-invitation-manager">
      <div className="section-header">
        <h3 className="title is-5">Enlaces de Invitación Compartibles</h3>
        <button 
          className="button is-primary is-small"
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={creating}
        >
          <span className="icon">
            <i className="fas fa-plus"></i>
          </span>
          <span>Crear Enlace</span>
        </button>
      </div>

      {error && (
        <div className="notification is-danger is-light">
          <button className="delete" onClick={() => setError(null)}></button>
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="box create-form">
          <h4 className="title is-6">Crear Nuevo Enlace de Invitación</h4>
          
          <div className="field">
            <label className="label">Expira en (días)</label>
            <div className="control">
              <input
                className="input"
                type="number"
                placeholder="Opcional - dejar vacío para sin expiración"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : '')}
                min="1"
                max="365"
              />
            </div>
            <p className="help">Dejar vacío para un enlace sin fecha de expiración</p>
          </div>

          <div className="field">
            <label className="label">Máximo de usos</label>
            <div className="control">
              <input
                className="input"
                type="number"
                placeholder="Opcional - dejar vacío para usos ilimitados"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value ? parseInt(e.target.value) : '')}
                min="1"
                max="1000"
              />
            </div>
            <p className="help">Dejar vacío para usos ilimitados</p>
          </div>

          <div className="field is-grouped">
            <div className="control">
              <button 
                className={`button is-primary ${creating ? 'is-loading' : ''}`}
                onClick={handleCreateInvitation}
                disabled={creating}
              >
                Crear Enlace
              </button>
            </div>
            <div className="control">
              <button 
                className="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setExpiryDays('');
                  setMaxUses('');
                  setError(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="has-text-centered">
          <div className="loader"></div>
          <p>Cargando enlaces...</p>
        </div>
      ) : (
        <div className="invitations-list">
          {invitations.length === 0 ? (
            <div className="empty-state">
              <p className="has-text-grey">No hay enlaces de invitación creados aún.</p>
              <p className="has-text-grey is-size-7">
                Los enlaces compartibles permiten que cualquier persona se una al coro sin necesidad de una invitación por email.
              </p>
            </div>
          ) : (
            invitations.map((invitation) => {
              const status = getInvitationStatus(invitation);
              return (
                <div key={invitation.invitationId} className="invitation-card">
                  <div className="card">
                    <div className="card-content">
                      <div className="invitation-header">
                        <div className="invitation-info">
                          <span className={`tag ${status.class}`}>
                            {status.text}
                          </span>
                          <span className="created-date">
                            Creado: {formatDate(invitation.dateCreated)}
                          </span>
                        </div>
                        <div className="invitation-stats">
                          <span className="stat">
                            <strong>{invitation.currentUses}</strong> usos
                            {invitation.maxUses && ` / ${invitation.maxUses}`}
                          </span>
                        </div>
                      </div>

                      <div className="invitation-url">
                        <div className="field has-addons">
                          <div className="control is-expanded">
                            <input
                              className="input is-small"
                              type="text"
                              value={`${window.location.origin}${invitation.invitationUrl}`}
                              readOnly
                            />
                          </div>
                          <div className="control">
                            <button
                              className="button is-small is-primary"
                              onClick={() => copyToClipboard(invitation.invitationUrl)}
                            >
                              <span className="icon">
                                <i className="fas fa-copy"></i>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {invitation.expiryDate && (
                        <div className="invitation-details">
                          <p className="is-size-7 has-text-grey">
                            Expira: {formatDate(invitation.expiryDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ShareableInvitationManager;
