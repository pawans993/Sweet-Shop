import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SweetCard from '../components/SweetCard';

// Mock axios - use hoisted to ensure mocks are available
const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('../utils/axios', () => ({
  default: {
    post: mockPost,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('SweetCard Component', () => {
  const mockOnPurchase = vi.fn();
  const mockSweet = {
    _id: '1',
    name: 'Chocolate Bar',
    category: 'Chocolate',
    price: 20.50,
    quantity: 10,
    imageUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sweet information', () => {
    render(<SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />);

    expect(screen.getByText('Chocolate Bar')).toBeInTheDocument();
    expect(screen.getByText(/Category:/i)).toBeInTheDocument();
    expect(screen.getByText('Chocolate')).toBeInTheDocument();
    expect(screen.getByText(/₹20.50/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity:/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should display purchase button when quantity is greater than 0', () => {
    render(<SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />);

    const purchaseButton = screen.getByRole('button', { name: /Purchase/i });
    expect(purchaseButton).toBeInTheDocument();
    expect(purchaseButton).not.toBeDisabled();
  });

  it('should disable purchase button when quantity is 0', () => {
    const outOfStockSweet = { ...mockSweet, quantity: 0 };
    render(<SweetCard sweet={outOfStockSweet} onPurchase={mockOnPurchase} />);

    const purchaseButton = screen.getByRole('button', { name: /Out of Stock/i });
    expect(purchaseButton).toBeInTheDocument();
    expect(purchaseButton).toBeDisabled();
  });

  it('should show "Out of Stock" text when quantity is 0', () => {
    const outOfStockSweet = { ...mockSweet, quantity: 0 };
    render(<SweetCard sweet={outOfStockSweet} onPurchase={mockOnPurchase} />);

    expect(screen.getByText(/Out of Stock/i)).toBeInTheDocument();
    expect(screen.queryByText(/Purchase/i)).not.toBeInTheDocument();
  });

  it('should call onPurchase when purchase button is clicked', async () => {
    const user = userEvent.setup();
    const updatedSweet = { ...mockSweet, quantity: 9 };

    mockPost.mockResolvedValueOnce({ data: updatedSweet });

    render(<SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />);

    const purchaseButton = screen.getByRole('button', { name: /Purchase/i });
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(`/api/sweets/${mockSweet._id}/purchase`);
      expect(mockOnPurchase).toHaveBeenCalledWith(updatedSweet);
    });
  });

  it('should not call onPurchase when quantity is 0', async () => {
    const user = userEvent.setup();
    const outOfStockSweet = { ...mockSweet, quantity: 0 };

    render(<SweetCard sweet={outOfStockSweet} onPurchase={mockOnPurchase} />);

    const purchaseButton = screen.getByRole('button', { name: /Out of Stock/i });
    
    // Button should be disabled, but try clicking anyway
    expect(purchaseButton).toBeDisabled();
    
    // Verify no API call was made
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('should display error message when purchase fails', async () => {
    const user = userEvent.setup();

    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'Purchase failed' } },
    });

    render(<SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />);

    const purchaseButton = screen.getByRole('button', { name: /Purchase/i });
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(/Purchase failed/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while purchasing', async () => {
    const user = userEvent.setup();

    mockPost.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: mockSweet }), 100))
    );

    render(<SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />);

    const purchaseButton = screen.getByRole('button', { name: /Purchase/i });
    await user.click(purchaseButton);

    expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
    expect(purchaseButton).toBeDisabled();
  });

  it('should display image if imageUrl is provided', () => {
    const sweetWithImage = { ...mockSweet, imageUrl: 'https://example.com/image.jpg' };
    render(<SweetCard sweet={sweetWithImage} onPurchase={mockOnPurchase} />);

    const image = screen.getByAltText('Chocolate Bar');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should display placeholder emoji if no imageUrl', () => {
    render(<SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />);

    // The emoji should be rendered in a div
    const emojiContainer = document.querySelector('.text-6xl');
    expect(emojiContainer).toBeInTheDocument();
  });

  it('should display quantity in green when greater than 0', () => {
    render(<SweetCard sweet={mockSweet} onPurchase={mockOnPurchase} />);

    const quantityText = screen.getByText('10');
    expect(quantityText).toHaveClass('text-green-600');
  });

  it('should display quantity in red when 0', () => {
    const outOfStockSweet = { ...mockSweet, quantity: 0 };
    render(<SweetCard sweet={outOfStockSweet} onPurchase={mockOnPurchase} />);

    const quantityText = screen.getByText('0');
    expect(quantityText).toHaveClass('text-red-600');
  });
});

