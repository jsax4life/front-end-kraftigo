export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPassword = (password: string, minLength: number = 6): boolean => {
  return password.length >= minLength;
};

export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

export const isNotEmpty = (value: string): boolean => {
  return value.trim() !== "";
};
