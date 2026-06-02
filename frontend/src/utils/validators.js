export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};

export const validateName = (name) => {
  if (!name || name.trim().length === 0) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || String(value).trim() === '') return `${fieldName} is required`;
  return null;
};

export const validateDate = (date) => {
  if (!date) return 'Date is required';
  const selected = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selected < today) return 'Please select a future date';
  return null;
};