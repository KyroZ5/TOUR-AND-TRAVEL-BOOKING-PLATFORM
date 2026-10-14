import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FirebaseSetupNotice from '../../src/components/common/FirebaseSetupNotice.jsx';

describe('FirebaseSetupNotice', () => {
  it('explains that Firebase is missing and how to fix it', () => {
    render(<FirebaseSetupNotice />);
    expect(
      screen.getByRole('heading', { name: /firebase is not configured/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Firebase console/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/npm run build/i)).toBeInTheDocument();
  });

  it('lists the required environment variables', () => {
    render(<FirebaseSetupNotice />);
    expect(screen.getByText('VITE_FIREBASE_API_KEY')).toBeInTheDocument();
    expect(screen.getByText('VITE_FIREBASE_PROJECT_ID')).toBeInTheDocument();
    expect(screen.getByText('VITE_FIREBASE_APP_ID')).toBeInTheDocument();
    expect(screen.getByText('VITE_FIREBASE_AUTH_DOMAIN')).toBeInTheDocument();
    expect(screen.getByText('VITE_FIREBASE_STORAGE_BUCKET')).toBeInTheDocument();
    expect(screen.getByText('VITE_FIREBASE_MESSAGING_SENDER_ID')).toBeInTheDocument();
  });
});
