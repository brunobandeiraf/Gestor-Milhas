// Augment Express Request with authenticated user info
declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
      registrationStatus: string;
    };
  }
}
