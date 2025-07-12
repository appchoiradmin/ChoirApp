export const UserRole = {
  GeneralUser: 'GeneralUser',
  ChoirAdmin: 'ChoirAdmin',
  ChoirMember: 'ChoirMember',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
