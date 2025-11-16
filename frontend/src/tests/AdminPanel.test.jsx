import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminPanel from '../pages/AdminPanel';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios - use hoisted to ensure mocks are available
const { mockGet, mockPost, mockPut, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('../utils/axios', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

const renderAdminPanel = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <AdminPanel />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AdminPanel Page', () => {
  const mockSweets = [
    {
      _id: '1',
      name: 'Chocolate Bar',
      category: 'Chocolate',
      price: 20.50,
      quantity: 10,
      imageUrl: null,
    },
    {
      _id: '2',
      name: 'Gummy Bears',
      category: 'Candy',
      price: 15.00,
      quantity: 20,
      imageUrl: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'admin', role: 'admin' }));
    mockGet.mockResolvedValue({ data: mockSweets });
  });

  it('should render admin panel title', async () => {
    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    });
  });

  it('should render "Add New Sweet" button', async () => {
    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add New Sweet/i })).toBeInTheDocument();
    });
  });

  it('should display sweets in a table', async () => {
    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
      expect(screen.getByText('Gummy Bears')).toBeInTheDocument();
    });
  });

  it('should show add form when "Add New Sweet" button is clicked', async () => {
    const user = userEvent.setup();
    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add New Sweet/i });
    await user.click(addButton);

    expect(screen.getByText(/Add New Sweet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity \*/i)).toBeInTheDocument();
  });

  it('should create a new sweet when form is submitted', async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValueOnce({ data: { _id: '3', name: 'New Sweet', category: 'Candy', price: 10, quantity: 5 } });

    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add New Sweet/i });
    await user.click(addButton);

    const nameInput = screen.getByLabelText(/Name \*/i);
    const categoryInput = screen.getByLabelText(/Category \*/i);
    const priceInput = screen.getByLabelText(/Price \*/i);
    const quantityInput = screen.getByLabelText(/Quantity \*/i);
    const submitButton = screen.getByRole('button', { name: /Add Sweet/i });

    await user.type(nameInput, 'New Sweet');
    await user.type(categoryInput, 'Candy');
    await user.type(priceInput, '10');
    await user.type(quantityInput, '5');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
  });

  it('should show edit form when Edit button is clicked', async () => {
    const user = userEvent.setup();
    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/Edit/i);
    await user.click(editButtons[0]);

    expect(screen.getByText(/Edit Sweet/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Chocolate Bar')).toBeInTheDocument();
  });

  it('should update sweet when edit form is submitted', async () => {
    const user = userEvent.setup();
    mockPut.mockResolvedValueOnce({ data: { ...mockSweets[0], name: 'Updated Sweet' } });

    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/Edit/i);
    await user.click(editButtons[0]);

    const nameInput = screen.getByDisplayValue('Chocolate Bar');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Sweet');

    const updateButton = screen.getByRole('button', { name: /Update Sweet/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalled();
    });
  });

  it('should show restock form when Restock button is clicked', async () => {
    const user = userEvent.setup();
    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
    });

    const restockButtons = screen.getAllByText(/Restock/i);
    await user.click(restockButtons[0]);

    expect(screen.getByText(/Restock: Chocolate Bar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount to Add \*/i)).toBeInTheDocument();
  });

  it('should restock sweet when restock form is submitted', async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValueOnce({ data: { ...mockSweets[0], quantity: 60 } });

    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
    });

    const restockButtons = screen.getAllByText(/Restock/i);
    await user.click(restockButtons[0]);

    const amountInput = screen.getByLabelText(/Amount to Add \*/i);
    const restockButton = screen.getByRole('button', { name: /Restock/i });

    await user.type(amountInput, '50');
    await user.click(restockButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        `/api/sweets/${mockSweets[0]._id}/restock`,
        { amount: 50 }
      );
    });
  });

  it('should delete sweet when Delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValueOnce(true);
    mockDelete.mockResolvedValueOnce({ data: { message: 'Sweet deleted successfully' } });

    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/Delete/i);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(`/api/sweets/${mockSweets[0]._id}`);
    });
  });

  it('should not delete sweet when Delete is cancelled', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValueOnce(false);

    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/Delete/i);
    await user.click(deleteButtons[0]);

    // Should not call delete API
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('should display error message when operation fails', async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'Failed to add sweet' } },
    });

    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add New Sweet/i });
    await user.click(addButton);

    const nameInput = screen.getByLabelText(/Name \*/i);
    const categoryInput = screen.getByLabelText(/Category \*/i);
    const priceInput = screen.getByLabelText(/Price \*/i);
    const quantityInput = screen.getByLabelText(/Quantity \*/i);
    const submitButton = screen.getByRole('button', { name: /Add Sweet/i });

    await user.type(nameInput, 'New Sweet');
    await user.type(categoryInput, 'Candy');
    await user.type(priceInput, '10');
    await user.type(quantityInput, '5');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to add sweet/i)).toBeInTheDocument();
    });
  });

  it('should display success message when operation succeeds', async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValueOnce({ data: { _id: '3', name: 'New Sweet', category: 'Candy', price: 10, quantity: 5 } });

    renderAdminPanel();

    await waitFor(() => {
      expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /Add New Sweet/i });
    await user.click(addButton);

    const nameInput = screen.getByLabelText(/Name \*/i);
    const categoryInput = screen.getByLabelText(/Category \*/i);
    const priceInput = screen.getByLabelText(/Price \*/i);
    const quantityInput = screen.getByLabelText(/Quantity \*/i);
    const submitButton = screen.getByRole('button', { name: /Add Sweet/i });

    await user.type(nameInput, 'New Sweet');
    await user.type(categoryInput, 'Candy');
    await user.type(priceInput, '10');
    await user.type(quantityInput, '5');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Sweet added successfully!/i)).toBeInTheDocument();
    });
  });

  it('should show loading spinner while fetching sweets', () => {
    mockGet.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
    );

    renderAdminPanel();

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

