export type Message = {
  role: 'user' | 'ai';
  content: string;
};

export interface IUser {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  department?: string;
  profilePicture?: string;
  role: 'user' | 'admin';
  token?: string;
  points?: number;
}
