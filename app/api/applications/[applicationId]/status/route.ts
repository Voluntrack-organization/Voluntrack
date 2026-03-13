import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

const BADGE_MILESTONES = [
  { id: 'first-steps', hours: 1 },
  { id: 'helping-hand', hours: 10 },
  { id: 'goal-setter', hours: 40 },
]

type AppStatus = 'pending' | 'approved' | 'completed' | 'denied'

export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  // 1. Verify session cookie
  const sessionCookie = request.cookies.get('session')?.value
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let decodedToken
  try {
    decodedToken = await adminAuth.verifyIdToken(sessionCookie)
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const callerUid = decodedToken.uid

  // 2. Load caller role
  const callerDoc = await adminDb.collection('users').doc(callerUid).get()
  if (!callerDoc.exists) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 })
  }
  const callerRole: string = callerDoc.data()?.role ?? ''

  // 3. Load application
  const { applicationId } = params
  const appDoc = await adminDb.collection('user_applications').doc(applicationId).get()
  if (!appDoc.exists) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }
  const appData = appDoc.data()!
  const currentStatus = appData.status as AppStatus
  const { opportunityId, userId: studentUid, hours } = appData

  // 4. Parse requested status
  const body = await request.json().catch(() => ({}))
  const newStatus: AppStatus = body.status

  // 5. Authorization
  if (callerRole === 'volunteer_org') {
    if (appData.orgId !== callerUid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (callerRole === 'student') {
    if (studentUid !== callerUid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 6. State machine validation
  type Transition = { from: AppStatus; to: AppStatus; role: string }
  const allowedTransitions: Transition[] = [
    { from: 'pending',   to: 'approved',   role: 'volunteer_org' },
    { from: 'pending',   to: 'denied',     role: 'volunteer_org' },
    { from: 'approved',  to: 'completed',  role: 'student' },
    { from: 'approved',  to: 'denied',     role: 'volunteer_org' },
  ]
  const isValid = allowedTransitions.some(
    t => t.from === currentStatus && t.to === newStatus && t.role === callerRole
  )
  if (!isValid) {
    return NextResponse.json(
      { error: `Invalid transition: ${currentStatus} → ${newStatus} for role ${callerRole}` },
      { status: 400 }
    )
  }

  // 7. Build batch write
  const batch = adminDb.batch()

  batch.update(adminDb.collection('user_applications').doc(applicationId), {
    status: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  })

  if (currentStatus === 'pending' && newStatus === 'approved') {
    batch.update(adminDb.collection('opportunities').doc(opportunityId), {
      spotsLeft: FieldValue.increment(-1),
    })
  }

  if (currentStatus === 'approved' && newStatus === 'denied') {
    batch.update(adminDb.collection('opportunities').doc(opportunityId), {
      spotsLeft: FieldValue.increment(1),
    })
  }

  if (newStatus === 'completed') {
    const profileDoc = await adminDb.collection('student_profiles').doc(studentUid).get()
    const currentHours: number = profileDoc.data()?.hoursCompleted ?? 0
    const currentBadges: string[] = profileDoc.data()?.badges ?? []
    const hoursToAdd: number = hours ?? 0
    const newTotalHours = currentHours + hoursToAdd

    const newBadges = [...currentBadges]
    for (const milestone of BADGE_MILESTONES) {
      if (newTotalHours >= milestone.hours && !newBadges.includes(milestone.id)) {
        newBadges.push(milestone.id)
      }
    }

    batch.update(adminDb.collection('student_profiles').doc(studentUid), {
      hoursCompleted: newTotalHours,
      badges: newBadges,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()

  return NextResponse.json({ success: true })
}
