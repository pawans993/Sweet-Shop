import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../components/SearchBar';

describe('SearchBar Component', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all search input fields', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    expect(screen.getByPlaceholderText(/Search by name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by category/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Min price/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Max price/i)).toBeInTheDocument();
  });

  it('should render search and reset buttons', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
  });

  it('should allow user to type in all search fields', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const nameInput = screen.getByPlaceholderText(/Search by name/i);
    const categoryInput = screen.getByPlaceholderText(/Search by category/i);
    const minPriceInput = screen.getByPlaceholderText(/Min price/i);
    const maxPriceInput = screen.getByPlaceholderText(/Max price/i);

    await user.type(nameInput, 'Chocolate');
    await user.type(categoryInput, 'Candy');
    await user.type(minPriceInput, '10');
    await user.type(maxPriceInput, '50');

    expect(nameInput).toHaveValue('Chocolate');
    expect(categoryInput).toHaveValue('Candy');
    expect(minPriceInput).toHaveValue(10);
    expect(maxPriceInput).toHaveValue(50);
  });

  it('should call onSearch with filters when form is submitted', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const nameInput = screen.getByPlaceholderText(/Search by name/i);
    const categoryInput = screen.getByPlaceholderText(/Search by category/i);
    const minPriceInput = screen.getByPlaceholderText(/Min price/i);
    const maxPriceInput = screen.getByPlaceholderText(/Max price/i);
    const searchButton = screen.getByRole('button', { name: /Search/i });

    await user.type(nameInput, 'Chocolate');
    await user.type(categoryInput, 'Candy');
    await user.type(minPriceInput, '10');
    await user.type(maxPriceInput, '50');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith({
      name: 'Chocolate',
      category: 'Candy',
      minPrice: '10',
      maxPrice: '50',
    });
  });

  it('should call onSearch with empty filters when reset is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const nameInput = screen.getByPlaceholderText(/Search by name/i);
    const resetButton = screen.getByRole('button', { name: /Reset/i });

    await user.type(nameInput, 'Chocolate');
    await user.click(resetButton);

    expect(mockOnSearch).toHaveBeenCalledWith({});
    expect(nameInput).toHaveValue('');
  });

  it('should clear all fields when reset is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const nameInput = screen.getByPlaceholderText(/Search by name/i);
    const categoryInput = screen.getByPlaceholderText(/Search by category/i);
    const minPriceInput = screen.getByPlaceholderText(/Min price/i);
    const maxPriceInput = screen.getByPlaceholderText(/Max price/i);
    const resetButton = screen.getByRole('button', { name: /Reset/i });

    await user.type(nameInput, 'Chocolate');
    await user.type(categoryInput, 'Candy');
    await user.type(minPriceInput, '10');
    await user.type(maxPriceInput, '50');
    await user.click(resetButton);

    expect(nameInput).toHaveValue('');
    expect(categoryInput).toHaveValue('');
    expect(minPriceInput).toHaveValue(null);
    expect(maxPriceInput).toHaveValue(null);
  });

  it('should call onSearch with partial filters', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const nameInput = screen.getByPlaceholderText(/Search by name/i);
    const searchButton = screen.getByRole('button', { name: /Search/i });

    await user.type(nameInput, 'Chocolate');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith({
      name: 'Chocolate',
      category: '',
      minPrice: '',
      maxPrice: '',
    });
  });
});

