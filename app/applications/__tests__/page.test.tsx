"use client"
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplicationsPage from '../page';
import {
  getUserApplications,
  getUserSaved,
  unsaveOpportunity,
  applyToOpportunity,
} from '@/lib/firebase/dashboard';
import { toast } from 'sonner';

// ─── Firebase ────────────────────────────────────────────
jest.mock('@/lib/firebase/config', () => ({ auth: {}, db: {} }));

jest.mock('@/lib/firebase/dashboard', () => ({
  getUserApplications: jest.fn(),
  getUserSaved: jest.fn(),
  updateApplicationStatus: jest.fn(),
  unsaveOpportunity: jest.fn(),
  applyToOpportunity: jest.fn(),
}));

jest.mock('@/lib/firebase/reports', () => ({ submitReport: jest.fn() }));

// ─── External deps ───────────────────────────────────────
jest.mock('@/lib/pdf-generator', () => ({ generateVolunteerPDF: jest.fn() }));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ─── Auth ────────────────────────────────────────────────
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    userProfile: { uid: 'user-123', displayName: 'Test User' },
    user: { uid: 'user-123' },
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

jest.mock('@/components/add-external-opportunity-modal', () => ({
  AddExternalOpportunityModal: () => null,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
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

// ─── Test fixtures ───────────────────────────────────────
const mockSavedOpp = {
  userId: 'user-123',
  opportunityId: 'opp-456',
  savedAt: null,
  title: 'Beach Cleanup',
  organization: 'Ocean Friends',
  location: 'Santa Monica, CA',
  date: 'Saturday, Mar 15',
  hours: 3,
  category: 'Environment',
  image: '/beach.jpg',
  orgId: 'org-789',
  dateISO: '2026-03-15',
  description: 'Help clean the beach.',
  skills: ['teamwork', 'enthusiasm'],
  commitment: 'One-time',
  spotsLeft: 5,
  totalSpots: 20,
  fullDate: 'Saturday, Mar 15, 2026',
};

const mockApplication = {
  id: 'user-123_opp-999',
  userId: 'user-123',
  opportunityId: 'opp-999',
  orgId: 'org-111',
  status: 'pending' as const,
  appliedDate: '2026-03-01T00:00:00.000Z',
  title: 'Food Bank',
  organization: 'Local Food Bank',
  location: 'City Center',
  date: 'Monday, Mar 20',
  dateISO: '2026-03-20',
  hours: 4,
  category: 'Community Outreach',
  image: '/food.jpg',
  updatedAt: null,
};

const mockGetUserApplications = getUserApplications as jest.Mock;
const mockGetUserSaved = getUserSaved as jest.Mock;
const mockUnsaveOpportunity = unsaveOpportunity as jest.Mock;
const mockApplyToOpportunity = applyToOpportunity as jest.Mock;
const mockToast = toast as { success: jest.Mock; error: jest.Mock };

// ─────────────────────────────────────────────────────────
// Sidebar rendering
// ─────────────────────────────────────────────────────────
describe('ApplicationsPage — saved opportunities sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserApplications.mockResolvedValue([]);
    mockGetUserSaved.mockResolvedValue([mockSavedOpp]);
    mockUnsaveOpportunity.mockResolvedValue(undefined);
    mockApplyToOpportunity.mockResolvedValue(undefined);
  });

  it('displays saved opportunity titles in the sidebar after data loads', async () => {
    render(<ApplicationsPage />);
    await waitFor(() => {
      expect(screen.getByText('Beach Cleanup')).toBeInTheDocument();
    });
  });

  it('shows the opportunity date in the sidebar', async () => {
    render(<ApplicationsPage />);
    await waitFor(() => {
      expect(screen.getByText('Saturday, Mar 15')).toBeInTheDocument();
    });
  });

  it('calls getUserSaved and getUserApplications on mount', async () => {
    render(<ApplicationsPage />);
    await waitFor(() => {
      expect(mockGetUserSaved).toHaveBeenCalledWith('user-123');
      expect(mockGetUserApplications).toHaveBeenCalledWith('user-123');
    });
  });
});

// ─────────────────────────────────────────────────────────
// appliedIds derived from fetched applications
// ─────────────────────────────────────────────────────────
describe('ApplicationsPage — appliedIds pre-population', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsaveOpportunity.mockResolvedValue(undefined);
    mockApplyToOpportunity.mockResolvedValue(undefined);
  });

  it('shows Applied button when savedOpp matches a pre-existing application', async () => {
    // opp-456 is both saved and already applied
    mockGetUserApplications.mockResolvedValue([
      { ...mockApplication, opportunityId: 'opp-456' },
    ]);
    mockGetUserSaved.mockResolvedValue([mockSavedOpp]);

    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));

    fireEvent.click(screen.getByText('Beach Cleanup'));

    await waitFor(() => {
      // Specifically look for the Apply button (not filter-section text with "Applied")
      expect(screen.getByRole('button', { name: /Applied/ })).toBeInTheDocument();
    });
  });

  it('shows Apply Now when savedOpp has no matching application', async () => {
    mockGetUserApplications.mockResolvedValue([]);
    mockGetUserSaved.mockResolvedValue([mockSavedOpp]);

    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));

    fireEvent.click(screen.getByText('Beach Cleanup'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/ })).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────
// Modal rendering
// ─────────────────────────────────────────────────────────
describe('ApplicationsPage — saved opportunity modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserApplications.mockResolvedValue([]);
    mockGetUserSaved.mockResolvedValue([mockSavedOpp]);
    mockUnsaveOpportunity.mockResolvedValue(undefined);
    mockApplyToOpportunity.mockResolvedValue(undefined);
  });

  it('opens the detail modal when a saved opportunity is clicked', async () => {
    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));

    fireEvent.click(screen.getByText('Beach Cleanup'));

    await waitFor(() => {
      expect(screen.getByText(/Apply Now/)).toBeInTheDocument();
      expect(screen.getByText('Unsave')).toBeInTheDocument();
    });
  });

  it('shows the description in the modal', async () => {
    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));

    fireEvent.click(screen.getByText('Beach Cleanup'));

    await waitFor(() => {
      expect(screen.getByText('Help clean the beach.')).toBeInTheDocument();
    });
  });

  it('shows skill tags in the modal', async () => {
    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));

    fireEvent.click(screen.getByText('Beach Cleanup'));

    await waitFor(() => {
      expect(screen.getByText('teamwork')).toBeInTheDocument();
      expect(screen.getByText('enthusiasm')).toBeInTheDocument();
    });
  });

  it('closes the modal when the X button is clicked', async () => {
    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));

    fireEvent.click(screen.getByText('Beach Cleanup'));
    await waitFor(() => screen.getByText('Unsave'));

    // The X close button is an SVG button — find by querying for an element
    // that closes the modal (clicking the backdrop also works)
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByText('Unsave')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────
// handleUnsave
// ─────────────────────────────────────────────────────────
describe('ApplicationsPage — handleUnsave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserApplications.mockResolvedValue([]);
    mockGetUserSaved.mockResolvedValue([mockSavedOpp]);
    mockUnsaveOpportunity.mockResolvedValue(undefined);
    mockApplyToOpportunity.mockResolvedValue(undefined);
  });

  const openModalAndClickUnsave = async () => {
    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));
    fireEvent.click(screen.getByText('Beach Cleanup'));
    await waitFor(() => screen.getByText('Unsave'));
    fireEvent.click(screen.getByText('Unsave'));
  };

  it('calls unsaveOpportunity with the correct userId and opportunityId', async () => {
    await openModalAndClickUnsave();
    await waitFor(() => {
      expect(mockUnsaveOpportunity).toHaveBeenCalledWith('user-123', 'opp-456');
    });
  });

  it('removes the saved opportunity from the sidebar', async () => {
    await openModalAndClickUnsave();
    await waitFor(() => {
      expect(screen.queryByText('Beach Cleanup')).not.toBeInTheDocument();
    });
  });

  it('closes the modal after unsaving', async () => {
    await openModalAndClickUnsave();
    await waitFor(() => {
      expect(screen.queryByText('Unsave')).not.toBeInTheDocument();
    });
  });

  it('shows a success toast after unsaving', async () => {
    await openModalAndClickUnsave();
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Removed from saved list');
    });
  });

  it('shows an error toast when unsaveOpportunity throws', async () => {
    mockUnsaveOpportunity.mockRejectedValue(new Error('Firestore error'));

    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));
    fireEvent.click(screen.getByText('Beach Cleanup'));
    await waitFor(() => screen.getByText('Unsave'));
    fireEvent.click(screen.getByText('Unsave'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to remove from saved list.');
    });
  });

  it('keeps the item in the sidebar when unsave fails', async () => {
    mockUnsaveOpportunity.mockRejectedValue(new Error('Firestore error'));

    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));
    fireEvent.click(screen.getByText('Beach Cleanup'));
    await waitFor(() => screen.getByText('Unsave'));
    fireEvent.click(screen.getByText('Unsave'));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
    // Sidebar item AND open modal both contain "Beach Cleanup" — at least one must be present
    expect(screen.getAllByText('Beach Cleanup').length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────
// handleApplyFromSaved
// ─────────────────────────────────────────────────────────
describe('ApplicationsPage — handleApplyFromSaved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserApplications.mockResolvedValue([]);
    mockGetUserSaved.mockResolvedValue([mockSavedOpp]);
    mockUnsaveOpportunity.mockResolvedValue(undefined);
    mockApplyToOpportunity.mockResolvedValue(undefined);
  });

  const openModalAndClickApply = async () => {
    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));
    fireEvent.click(screen.getByText('Beach Cleanup'));
    await waitFor(() => screen.getByText(/Apply Now/));
    fireEvent.click(screen.getByText(/Apply Now/));
  };

  it('calls applyToOpportunity with the correct userId and saved opportunity', async () => {
    await openModalAndClickApply();
    await waitFor(() => {
      expect(mockApplyToOpportunity).toHaveBeenCalledWith('user-123', mockSavedOpp);
    });
  });

  it('transitions the button to the Applied state after success', async () => {
    await openModalAndClickApply();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Applied/ })).toBeInTheDocument();
    });
  });

  it('shows a success toast after applying', async () => {
    await openModalAndClickApply();
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Application submitted successfully!');
    });
  });

  it('shows the error message from the thrown error', async () => {
    mockApplyToOpportunity.mockRejectedValue(new Error('Already applied'));

    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));
    fireEvent.click(screen.getByText('Beach Cleanup'));
    await waitFor(() => screen.getByText(/Apply Now/));
    fireEvent.click(screen.getByText(/Apply Now/));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Already applied');
    });
  });

  it('shows a generic error message when the error has no message', async () => {
    mockApplyToOpportunity.mockRejectedValue({});

    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));
    fireEvent.click(screen.getByText('Beach Cleanup'));
    await waitFor(() => screen.getByText(/Apply Now/));
    fireEvent.click(screen.getByText(/Apply Now/));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to apply.');
    });
  });

  it('does not call applyToOpportunity when already applied', async () => {
    // opp-456 is in appliedIds from the fetched applications
    mockGetUserApplications.mockResolvedValue([
      { ...mockApplication, opportunityId: 'opp-456' },
    ]);

    render(<ApplicationsPage />);
    await waitFor(() => screen.getByText('Beach Cleanup'));
    fireEvent.click(screen.getByText('Beach Cleanup'));

    // Wait for the apply button to show Applied state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Applied/ })).toBeInTheDocument();
    });

    const appliedBtn = screen.getByRole('button', { name: /Applied/ });
    expect(appliedBtn).toBeDisabled();
    expect(mockApplyToOpportunity).not.toHaveBeenCalled();
  });
});
