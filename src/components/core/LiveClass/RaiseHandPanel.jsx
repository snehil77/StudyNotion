// src/components/core/LiveClass/RaiseHandPanel.jsx
import { MdPanTool, MdCheckCircle } from "react-icons/md"

export default function RaiseHandPanel({ raisedHands, isInstructor, onDismiss }) {
  return (
    <div className="flex h-full flex-col p-3">
      {raisedHands.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <MdPanTool size={32} className="text-richblack-600" />
          <p className="text-sm text-richblack-500">No hands raised right now</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-richblack-400 mb-2">
            {raisedHands.length} student{raisedHands.length > 1 ? "s" : ""} waiting
          </p>
          {raisedHands.map((hand, idx) => (
            <div
              key={hand.userId}
              className="flex items-center justify-between rounded-xl bg-richblack-700 px-3 py-3"
            >
              <div className="flex items-center gap-3">
                {/* Position badge */}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-50 bg-opacity-20 text-[11px] font-bold text-yellow-50">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-richblack-5">{hand.name}</p>
                  <p className="text-[10px] text-richblack-500">Wants to speak</p>
                </div>
              </div>

              {/* Instructor can dismiss */}
              {isInstructor && (
                <button
                  onClick={() => onDismiss(hand.userId)}
                  className="flex items-center gap-1 rounded-lg bg-caribbeangreen-600 bg-opacity-30 px-2 py-1 text-[11px] font-medium text-caribbeangreen-100 hover:bg-opacity-50 transition-all"
                >
                  <MdCheckCircle size={14} />
                  Done
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ─── Participants Panel ────────────────────────────────────────────────────────
// src/components/core/LiveClass/ParticipantsPanel.jsx  (export separately if needed)
export function ParticipantsPanel({ participants, currentUserId }) {
  return (
    <div className="flex h-full flex-col p-3">
      <p className="mb-3 text-xs text-richblack-400">
        {participants.length + 1} in this class
      </p>

      {/* Self */}
      <ParticipantRow name="You (Me)" isSelf />

      {/* Others */}
      {participants.map((p) => (
        <ParticipantRow key={p.id} name={p.name} isMicOn={p.isMicOn} isCamOn={p.isCamOn} />
      ))}
    </div>
  )
}

function ParticipantRow({ name, isSelf, isMicOn = true, isCamOn = true }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="mb-2 flex items-center gap-3 rounded-xl bg-richblack-700 px-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-richblack-600 text-xs font-bold text-richblack-5">
        {initials}
      </div>
      <span className="flex-1 text-sm text-richblack-5">
        {name}
        {isSelf && <span className="ml-1 text-[10px] text-richblack-400">(you)</span>}
      </span>
      <div className="flex gap-1">
        {!isMicOn && (
          <span className="rounded bg-pink-200 bg-opacity-20 p-0.5 text-pink-200">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
            </svg>
          </span>
        )}
        {!isCamOn && (
          <span className="rounded bg-pink-200 bg-opacity-20 p-0.5 text-pink-200">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 6.5l-4-4-9.19 9.19 3.97 3.97L21 6.5zM3.27 2L2 3.27 6.73 8 4 8v8l4-4 2 2v2.73L14.73 20 16 18.73 3.27 2z" />
            </svg>
          </span>
        )}
      </div>
    </div>
  )
}
