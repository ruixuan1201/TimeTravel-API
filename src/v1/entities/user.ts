export interface IUser {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  stripeCustomerId?: string;
  phone: string;
  photoURL?: string;
  refreshToken?: string;
  verificationToken?: string;
  FCMToken?: string;
  terms: {
    termsAccepted?: boolean;
    acceptedSmsCommunication?: boolean;
  };
  lastLogin?: {
    date: string;
    time: string;
  };
}
