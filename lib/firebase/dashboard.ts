import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    deleteDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./config";
import { Opportunity } from "./opportunities";

export const BADGE_MILESTONES = [
    { id: "first-steps", hours: 1, name: "First Steps" },
    { id: "helping-hand", hours: 10, name: "Helping Hand" },
    { id: "goal-setter", hours: 40, name: "Goal Setter" },
];

export interface StructuredReflection {
    orgDescription: string;   // "What does the organization do?"
    howHelped: string;         // "How did you help?"
    whatLearned: string;       // "What did you learn?"
}

export interface UserApplication {
    id: string;
    userId: string;
    opportunityId: string;
    orgId: string;
    status: "pending" | "approved" | "completed" | "denied";
    appliedDate: string; // ISO
    // Snapshot of opportunity details at time of application for fast rendering
    title: string;
    organization: string;
    location: string;
    date: string;       // Display date from opportunity
    dateISO: string;    // Date for sorting/calendar
    hours: number;      // Numeric hours
    category: string;
    image: string;
    // Extra fields for detail popups
    description?: string;
    skills?: string[];
    commitment?: string;
    spotsLeft?: number;
    totalSpots?: number;
    updatedAt: any;
    // External Opportunity Fields
    isExternal?: boolean;
    reflection?: StructuredReflection | string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
}

export interface SavedOpportunity {
    userId: string;
    opportunityId: string;
    savedAt: any;
    // Snapshot of opportunity details
    title: string;
    organization: string;
    location: string;
    date: string;
    hours: number;
    category: string;
    image: string;
    orgId: string;
    dateISO: string;
    // Extra fields for detail popups
    description?: string;
    skills?: string[];
    commitment?: string;
    spotsLeft?: number;
    totalSpots?: number;
    fullDate?: string;
}

/**
 * Fetch all applications for a specific user
 */
export async function getUserApplications(userId: string): Promise<UserApplication[]> {
    try {
        const appsRef = collection(db, "user_applications");
        const q = query(appsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserApplication));
    } catch (error) {
        console.error("Error fetching user applications:", error);
        throw error;
    }
}

/**
 * Fetch all saved opportunities for a specific user
 */
export async function getUserSaved(userId: string): Promise<SavedOpportunity[]> {
    try {
        const savedRef = collection(db, "user_saved_opportunities");
        const q = query(savedRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as SavedOpportunity);
    } catch (error) {
        console.error("Error fetching saved opportunities:", error);
        throw error;
    }
}

/**
 * Toggle save status of an opportunity
 */
export async function toggleSaveOpportunity(userId: string, opportunity: Opportunity): Promise<boolean> {
    try {
        const savedDocRef = doc(db, "user_saved_opportunities", `${userId}_${opportunity.id}`);
        const savedDoc = await getDoc(savedDocRef);

        if (savedDoc.exists()) {
            await deleteDoc(savedDocRef);
            return false; // Removed
        } else {
            const savedData: SavedOpportunity = {
                userId,
                opportunityId: opportunity.id,
                savedAt: serverTimestamp(),
                title: opportunity.title,
                organization: opportunity.organization,
                location: opportunity.location,
                date: opportunity.date,
                hours: opportunity.hours,
                category: opportunity.category,
                image: opportunity.image,
                orgId: opportunity.orgId,
                dateISO: opportunity.dateISO,
                description: opportunity.description,
                skills: opportunity.skills,
                commitment: opportunity.commitment,
                spotsLeft: opportunity.spotsLeft,
                totalSpots: opportunity.totalSpots,
                fullDate: opportunity.date
            };
            await setDoc(savedDocRef, savedData);
            return true; // Added
        }
    } catch (error) {
        console.error("Error toggling saved opportunity:", error);
        throw error;
    }
}

/**
 * Remove a saved opportunity
 */
export async function unsaveOpportunity(userId: string, opportunityId: string): Promise<void> {
    const savedDocRef = doc(db, "user_saved_opportunities", `${userId}_${opportunityId}`);
    await deleteDoc(savedDocRef);
}

/**
 * Check if an opportunity is saved by the user
 */
export async function isOpportunitySaved(userId: string, opportunityId: string): Promise<boolean> {
    try {
        const savedDocRef = doc(db, "user_saved_opportunities", `${userId}_${opportunityId}`);
        const savedDoc = await getDoc(savedDocRef);
        return savedDoc.exists();
    } catch (error) {
        console.error("Error checking saved status:", error);
        return false;
    }
}

/**
 * Apply to an opportunity
 */
export async function applyToOpportunity(userId: string, opportunity: Opportunity): Promise<void> {
    try {
        const appRef = doc(db, "user_applications", `${userId}_${opportunity.id}`);
        const appDoc = await getDoc(appRef);

        if (appDoc.exists()) {
            throw new Error("You have already applied to this opportunity.");
        }

        const appData: Omit<UserApplication, "id"> = {
            userId,
            opportunityId: opportunity.id,
            orgId: opportunity.orgId,
            status: "pending",
            appliedDate: new Date().toISOString(),
            title: opportunity.title,
            organization: opportunity.organization,
            location: opportunity.location,
            date: opportunity.date,
            dateISO: opportunity.dateISO,
            hours: opportunity.hours,
            category: opportunity.category,
            image: opportunity.image,
            description: opportunity.description,
            skills: opportunity.skills,
            commitment: opportunity.commitment,
            spotsLeft: opportunity.spotsLeft,
            totalSpots: opportunity.totalSpots,
            updatedAt: serverTimestamp()
        };

        await setDoc(appRef, appData);
    } catch (error) {
        console.error("Error applying to opportunity:", error);
        throw error;
    }
}

/**
 * Update application status via secure server-side API route.
 * The API enforces ownership and valid state transitions.
 */
export async function updateApplicationStatus(
    userId: string,
    opportunityId: string,
    status: "approved" | "completed" | "denied"
): Promise<void> {
    const applicationId = `${userId}_${opportunityId}`;
    const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to update application status (${response.status})`);
    }
}

/**
 * Submit an external opportunity
 */
export async function submitExternalOpportunity(
    userId: string,
    data: {
        title: string;
        organization: string;
        date: string;
        hours: number;
        category: string;
        reflection: string;
        contactName: string;
        contactEmail: string;
        contactPhone?: string;
    }
): Promise<void> {
    try {
        const opportunityId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const appRef = doc(db, "user_applications", `${userId}_${opportunityId}`);

        // Parse date for display and sorting
        const parsedDate = new Date(data.date);
        const dateStr = parsedDate.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        const dateISO = parsedDate.toISOString().split('T')[0];

        const appData: Omit<UserApplication, "id"> = {
            userId,
            opportunityId,
            status: "completed", // Auto-complete external opportunities
            appliedDate: new Date().toISOString(),
            title: data.title,
            organization: data.organization,
            location: "External",
            date: dateStr,
            dateISO,
            hours: data.hours,
            category: data.category,
            image: "/icon.svg", // Default image
            updatedAt: serverTimestamp(),
            // External specific fields
            isExternal: true,
            reflection: data.reflection,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
        };

        await setDoc(appRef, appData);

        // Immediately increment hours and process badges
        const profileRef = doc(db, "student_profiles", userId);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
            const currentHours = profileDoc.data()?.hoursCompleted || 0;
            const currentBadges = profileDoc.data()?.badges || [];
            const hoursToAdd = data.hours || 0;
            const newTotalHours = currentHours + hoursToAdd;

            const newBadges = [...currentBadges];
            BADGE_MILESTONES.forEach(milestone => {
                if (newTotalHours >= milestone.hours && !newBadges.includes(milestone.id)) {
                    newBadges.push(milestone.id);
                }
            });

            await updateDoc(profileRef, {
                hoursCompleted: newTotalHours,
                badges: newBadges,
                updatedAt: serverTimestamp()
            });
        }

    } catch (error) {
        console.error("Error submitting external opportunity:", error);
        throw error;
    }
}

/**
 * Submit a structured reflection for a completed/approved opportunity
 */
export async function submitReflection(
    userId: string,
    opportunityId: string,
    reflection: StructuredReflection
): Promise<void> {
    try {
        const appRef = doc(db, "user_applications", `${userId}_${opportunityId}`);
        const appDoc = await getDoc(appRef);

        if (!appDoc.exists()) throw new Error("Application not found.");

        await updateDoc(appRef, {
            reflection,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error submitting reflection:", error);
        throw error;
    }
}
