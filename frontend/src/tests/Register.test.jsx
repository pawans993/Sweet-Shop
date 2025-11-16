import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios
vi.mock('../utils/axios', () => ({
  default: {
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render register form with all fields', () => {
    renderRegister();

    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password \(min 6 characters\)/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
  });

  it('should show link to login page', () => {
    renderRegister();

    const loginLink = screen.getByRole('link', { name: /Login here/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('should allow user to fill all form fields', async () => {
    const user = userEvent.setup();
    renderRegister();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByPlaceholderText(/Password \(min 6 characters\)/i);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const roleSelect = screen.getByLabelText(/Role/i);

    await user.type(usernameInput, 'newuser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.selectOptions(roleSelect, 'admin');

    expect(usernameInput).toHaveValue('newuser');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
    expect(roleSelect).toHaveValue('admin');
  });

  it('should show error if username is too short', async () => {
    const user = userEvent.setup();
    renderRegister();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByPlaceholderText(/Password \(min 6 characters\)/i);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /Register/i });

    await user.type(usernameInput, 'ab');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('should show error if password is too short', async () => {
    const user = userEvent.setup();
    renderRegister();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByPlaceholderText(/Password \(min 6 characters\)/i);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /Register/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, '12345');
    await user.type(confirmPasswordInput, '12345');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should show error if passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegister();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByPlaceholderText(/Password \(min 6 characters\)/i);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /Register/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should show error message on failed registration', async () => {
    const user = userEvent.setup();
    const api = await import('../utils/axios');

    api.default.post.mockRejectedValueOnce({
      response: { data: { message: 'Username already taken' } },
    });

    renderRegister();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByPlaceholderText(/Password \(min 6 characters\)/i);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /Register/i });

    await user.type(usernameInput, 'existinguser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username already taken/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    const api = await import('../utils/axios');

    api.default.post.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100))
    );

    renderRegister();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByPlaceholderText(/Password \(min 6 characters\)/i);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /Register/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Creating account.../i)).toBeInTheDocument();
  });

  it('should navigate to dashboard after successful registration as user', async () => {
    const user = userEvent.setup();
    const api = await import('../utils/axios');

    api.default.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: { id: '1', username: 'newuser', role: 'user' },
      },
    });

    renderRegister();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByPlaceholderText(/Password \(min 6 characters\)/i);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: /Register/i });

    await user.type(usernameInput, 'newuser');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should navigate to admin panel after successful registration as admin', async () => {
    const user = userEvent.setup();
    const api = await import('../utils/axios');

    api.default.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: { id: '1', username: 'admin', role: 'admin' },
      },
    });

    renderRegister();

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByPlaceholderText(/Password \(min 6 characters\)/i);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
    const roleSelect = screen.getByLabelText(/Role/i);
    const submitButton = screen.getByRole('button', { name: /Register/i });

    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.selectOptions(roleSelect, 'admin');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });
  });
});

