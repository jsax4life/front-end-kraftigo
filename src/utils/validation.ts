export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPassword = (
  password: string,
  minLength: number = 6,
): boolean => {
  return password.length >= minLength;
};

export const passwordsMatch = (
  password: string,
  confirmPassword: string,
): boolean => {
  return password === confirmPassword;
};

export const isNotEmpty = (value: string): boolean => {
  return value.trim() !== "";
};

export const isNumeric = (value: string): boolean => {
  return /^\d+$/.test(value);
};

export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 letter, 1 number
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/.test(password);
};

export const isValidPhoneLength = (phone: string): boolean => {
  return /^\d{10}$/.test(phone);
};
