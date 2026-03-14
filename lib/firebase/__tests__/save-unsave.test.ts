import { unsaveOpportunity, toggleSaveOpportunity } from '../dashboard';
import { doc, deleteDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('../config', () => ({
  db: {},
}));

const mockDoc = doc as jest.Mock;
const mockDeleteDoc = deleteDoc as jest.Mock;
const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;

const mockOpportunity = {
  id: 'opp-456',
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
  skills: ['teamwork'],
  commitment: 'One-time',
  spotsLeft: 5,
  totalSpots: 20,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDoc.mockImplementation((_db: any, collection: string, id: string) => `${collection}/${id}`);
});

// ─────────────────────────────────────────────────────────
// unsaveOpportunity
// ─────────────────────────────────────────────────────────
describe('unsaveOpportunity', () => {
  it('calls deleteDoc with the correct composite document reference', async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await unsaveOpportunity('user-123', 'opp-456');

    expect(mockDoc).toHaveBeenCalledWith({}, 'user_saved_opportunities', 'user-123_opp-456');
    expect(mockDeleteDoc).toHaveBeenCalledWith('user_saved_opportunities/user-123_opp-456');
  });

  it('propagates Firestore errors to the caller', async () => {
    mockDeleteDoc.mockRejectedValue(new Error('Network error'));

    await expect(unsaveOpportunity('user-123', 'opp-456')).rejects.toThrow('Network error');
  });

  it('uses userId and opportunityId to construct the document path', async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await unsaveOpportunity('user-abc', 'opp-xyz');

    expect(mockDoc).toHaveBeenCalledWith({}, 'user_saved_opportunities', 'user-abc_opp-xyz');
  });
});

// ─────────────────────────────────────────────────────────
// toggleSaveOpportunity — orgId / dateISO fields
// ─────────────────────────────────────────────────────────
describe('toggleSaveOpportunity — orgId and dateISO fields', () => {
  it('includes orgId and dateISO in the Firestore snapshot when saving', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    const result = await toggleSaveOpportunity('user-123', mockOpportunity as any);

    expect(result).toBe(true);
    expect(mockSetDoc).toHaveBeenCalledWith(
      'user_saved_opportunities/user-123_opp-456',
      expect.objectContaining({
        orgId: 'org-789',
        dateISO: '2026-03-15',
        opportunityId: 'opp-456',
        userId: 'user-123',
      })
    );
  });

  it('persists all required snapshot fields', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await toggleSaveOpportunity('user-123', mockOpportunity as any);

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
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
        skills: ['teamwork'],
        commitment: 'One-time',
        spotsLeft: 5,
        totalSpots: 20,
        savedAt: 'mock-timestamp',
      })
    );
  });

  it('deletes the document when already saved (toggle off) and returns false', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true });
    mockDeleteDoc.mockResolvedValue(undefined);

    const result = await toggleSaveOpportunity('user-123', mockOpportunity as any);

    expect(result).toBe(false);
    expect(mockDeleteDoc).toHaveBeenCalledWith('user_saved_opportunities/user-123_opp-456');
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('does not call deleteDoc when saving a new opportunity', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await toggleSaveOpportunity('user-123', mockOpportunity as any);

    expect(mockDeleteDoc).not.toHaveBeenCalled();
  });
});
