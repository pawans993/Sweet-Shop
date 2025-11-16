import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';

// Mock axios - use hoisted to ensure mocks are available
const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('../utils/axios', () => ({
  default: {
    get: mockGet,
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock SweetCard component
vi.mock('../components/SweetCard', () => ({
  default: ({ sweet, onPurchase }) => (
    <div data-testid={`sweet-card-${sweet._id}`}>
      <h3>{sweet.name}</h3>
      <p>{sweet.category}</p>
      <p>₹{sweet.price.toFixed(2)}</p>
      <p>Quantity: {sweet.quantity}</p>
      <button onClick={() => onPurchase(sweet)}>Purchase</button>
    </div>
  ),
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'testuser', role: 'user' }));
  });

  it('should render dashboard title', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Sweet Shop Dashboard/i)).toBeInTheDocument();
    });
  });

  it('should display loading spinner while fetching sweets', () => {
    mockGet.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
    );

    renderDashboard();

    // Check for loading spinner (the spinner has a specific class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display sweets list when data is loaded', async () => {
    const mockSweets = [
      {
        _id: '1',
        name: 'Chocolate Bar',
        category: 'Chocolate',
        price: 20.50,
        quantity: 10,
      },
      {
        _id: '2',
        name: 'Gummy Bears',
        category: 'Candy',
        price: 15.00,
        quantity: 20,
      },
    ];

    mockGet.mockResolvedValueOnce({ data: mockSweets });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
      expect(screen.getByText('Gummy Bears')).toBeInTheDocument();
    });

    expect(screen.getByTestId('sweet-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('sweet-card-2')).toBeInTheDocument();
  });

  it('should display "No sweets found" when no sweets exist', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/No sweets found/i)).toBeInTheDocument();
    });
  });

  it('should display error message when fetch fails', async () => {
    mockGet.mockRejectedValueOnce({
      response: { data: { message: 'Failed to fetch sweets' } },
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch sweets/i)).toBeInTheDocument();
    });
  });

  it('should call search API when search is performed', async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ data: [] });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Sweet Shop Dashboard/i)).toBeInTheDocument();
    });

    // SearchBar should be rendered
    const searchInput = screen.getByPlaceholderText(/Search by name/i);
    expect(searchInput).toBeInTheDocument();

    // Type in search field and submit
    await user.type(searchInput, 'Chocolate');
    const searchButton = screen.getByRole('button', { name: /Search/i });
    await user.click(searchButton);

    await waitFor(() => {
      // Should call search endpoint
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/sweets/search')
      );
    });
  });

  it('should update sweets list after purchase', async () => {
    const user = userEvent.setup();
    const initialSweets = [
      {
        _id: '1',
        name: 'Chocolate Bar',
        category: 'Chocolate',
        price: 20.50,
        quantity: 10,
      },
    ];

    mockGet.mockResolvedValueOnce({ data: initialSweets });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
    });

    // Find and click purchase button
    const purchaseButton = screen.getByRole('button', { name: /Purchase/i });
    await user.click(purchaseButton);

    // The quantity should be updated in the UI
    await waitFor(() => {
      expect(screen.getByText(/Quantity: 9/i)).toBeInTheDocument();
    });
  });
});

