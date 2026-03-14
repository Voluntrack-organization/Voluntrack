import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import OpportunitiesPage from '../page';

// ─── Firebase ────────────────────────────────────────────
jest.mock('@/lib/firebase/config', () => ({
  auth: {},
  db: {},
  default: {},
}));

jest.mock('@/lib/firebase/opportunities', () => ({
  getAllOpportunities: jest.fn(),
}));

jest.mock('@/lib/firebase/dashboard', () => ({
  applyToOpportunity: jest.fn(),
  toggleSaveOpportunity: jest.fn(),
  getUserApplications: jest.fn().mockResolvedValue([]),
  getUserSaved: jest.fn(),
}));

jest.mock('@/lib/firebase/student-profiles', () => ({
  getStudentProfile: jest.fn().mockResolvedValue(null),
}));

// ─── Auth ────────────────────────────────────────────────
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { uid: 'test-uid', interests: [] },
    user: { uid: 'test-uid' },
    loading: false,
  }),
}));

// ─── UI Components ───────────────────────────────────────
jest.mock('@/components/navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ onCheckedChange, checked, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={!!checked}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onCheckedChange && onCheckedChange(e.target.checked)
      }
    />
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <>{children}</>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/calendar', () => ({
  Calendar: () => null,
}));

// ─── Test fixture ────────────────────────────────────────
const mockOpportunity = {
  id: 'opp-1',
  title: 'Riverside Cleanup',
  organization: 'Green Earth',
  description: 'Help clean the riverside.',
  location: 'Austin, TX',
  date: 'Sunday, Apr 5',
  dateISO: '2026-04-05',
  time: '9:00 AM',
  hours: 2,
  spotsLeft: 10,
  totalSpots: 20,
  category: 'Environment',
  commitment: 'One-time',
  skills: ['outdoor'],
  featured: false,
  image: '/riverside.jpg',
  orgId: 'org-111',
};

// ─────────────────────────────────────────────────────────
// Bookmark badge visibility
// ─────────────────────────────────────────────────────────
describe('Opportunities page — saved bookmark badge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getAllOpportunities } = require('@/lib/firebase/opportunities');
    (getAllOpportunities as jest.Mock).mockResolvedValue([mockOpportunity]);
  });

  it('does not render an amber bookmark badge when the opportunity is not saved', async () => {
    const { getUserSaved } = require('@/lib/firebase/dashboard');
    (getUserSaved as jest.Mock).mockResolvedValue([]);

    render(<OpportunitiesPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Riverside Cleanup/).length).toBeGreaterThan(0);
    });

    // Wait for user data fetch to settle
    await waitFor(() => {
      expect(getUserSaved).toHaveBeenCalled();
    });

    expect(document.querySelector('.bg-amber-400')).not.toBeInTheDocument();
  });

  it('renders an amber bookmark badge when the opportunity is saved', async () => {
    const { getUserSaved } = require('@/lib/firebase/dashboard');
    (getUserSaved as jest.Mock).mockResolvedValue([
      { opportunityId: 'opp-1', title: 'Riverside Cleanup', category: 'Environment' },
    ]);

    render(<OpportunitiesPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Riverside Cleanup/).length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(document.querySelector('.bg-amber-400')).toBeInTheDocument();
    });
  });

  it('shifts the spots-left pill to right-12 when the opportunity is saved', async () => {
    const { getUserSaved } = require('@/lib/firebase/dashboard');
    (getUserSaved as jest.Mock).mockResolvedValue([
      { opportunityId: 'opp-1', title: 'Riverside Cleanup', category: 'Environment' },
    ]);

    render(<OpportunitiesPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/spots left/).length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      const spotsEl = screen.getAllByText(/spots left/)[0].closest('div');
      expect(spotsEl).toHaveClass('right-12');
    });
  });

  it('keeps the spots-left pill at right-3 when the opportunity is not saved', async () => {
    const { getUserSaved } = require('@/lib/firebase/dashboard');
    (getUserSaved as jest.Mock).mockResolvedValue([]);

    render(<OpportunitiesPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/spots left/).length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(getUserSaved).toHaveBeenCalled();
    });

    const spotsEl = screen.getAllByText(/spots left/)[0].closest('div');
    expect(spotsEl).toHaveClass('right-3');
    expect(spotsEl).not.toHaveClass('right-12');
  });

  it('shows bookmarks for saved opportunities and none for unsaved ones', async () => {
    // Two opportunities but only one is saved
    const { getAllOpportunities } = require('@/lib/firebase/opportunities');
    (getAllOpportunities as jest.Mock).mockResolvedValue([
      mockOpportunity,
      { ...mockOpportunity, id: 'opp-2', title: 'Food Drive' },
    ]);

    const { getUserSaved } = require('@/lib/firebase/dashboard');
    (getUserSaved as jest.Mock).mockResolvedValue([
      { opportunityId: 'opp-1', title: 'Riverside Cleanup', category: 'Environment' },
    ]);

    render(<OpportunitiesPage />);

    await waitFor(() => {
      expect(document.querySelectorAll('.bg-amber-400').length).toBe(1);
    });
  });
});
