export interface FormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
}

export interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: FormData) => Promise<void>;
  onToggleMode: () => void;
  loading?: boolean;
}
