export const homePath = () => '/';

export const signUpPath = () => '/sign-up';
export const signInPath = () => '/sign-in';
export const passwordForgotPath = () => '/password-forgot';

export const accountProfilePath = () => '/account/profile';
export const accountPasswordPath = () => '/account/password';

export const ticketsPath = () => '/tickets';
export const ticketPath = (ticketId: string) => `/tickets/${ticketId}`;
export const ticketEditPath = (ticketId: string) => `/tickets/${ticketId}/edit`;

// Posted Items paths

export const postedItemPath = (postedItemId: string) => `/wall/${postedItemId}`;
export const postedItemEditPath = (postedItemId: string) =>
  `/wall/${postedItemId}/edit`;

//wall

export const usersWallPath = (userId: string) => `/wall/${userId}`;

// Messages path
export const messagesPath = () => '/messages';

// Disclaimer path
export const disclaimerPath = () => '/disclaimer';

export const itemPath = (itemId: string) => `/item/${itemId}`;
