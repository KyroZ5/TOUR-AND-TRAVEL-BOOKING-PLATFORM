import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../../src/components/common/ConfirmDialog.jsx';

describe('ConfirmDialog', () => {
  function setup(props = {}) {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete item?"
        message="This cannot be undone."
        onConfirm={onConfirm}
        onClose={onClose}
        {...props}
      />
    );
    return { onConfirm, onClose };
  }

  it('shows the title and message when open', () => {
    setup();
    expect(screen.getByText('Delete item?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('fires onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('fires onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom labels', () => {
    setup({ confirmLabel: 'Yes, delete', cancelLabel: 'Never mind' });
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Never mind' })).toBeInTheDocument();
  });

  it('disables both buttons while loading', () => {
    setup({ loading: true });
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
  });

  it('renders nothing visible when closed', () => {
    render(
      <ConfirmDialog open={false} title="Hidden" onConfirm={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
