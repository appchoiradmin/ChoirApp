export interface Invitation {
  invitationToken: string;
  choirId: string;
  choirName: string;
  email: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  sentAt: string;
}
