import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusChip from '../../src/components/common/StatusChip.jsx';

describe('StatusChip', () => {
  it('renders a human-readable booking status label', () => {
    render(<StatusChip type="booking" value="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('maps payment statuses', () => {
    render(<StatusChip type="payment" value="pending_verification" />);
    expect(screen.getByText('Pending verification')).toBeInTheDocument();
  });

  it('maps account and departure statuses', () => {
    const { rerender } = render(<StatusChip type="account" value="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    rerender(<StatusChip type="departure" value="closed" />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('falls back to the raw value for unknown statuses', () => {
    render(<StatusChip type="booking" value="mystery" />);
    expect(screen.getByText('mystery')).toBeInTheDocument();
  });

  it('falls back to the booking map for an unknown type', () => {
    render(<StatusChip type="unknown" value="confirmed" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('shows "Unknown" when no value is given', () => {
    render(<StatusChip type="booking" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
