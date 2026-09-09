import { Check, X, Clock } from "lucide-react";

const STAGES = [
  { key: "RAISED", label: "Raised" },
  { key: "MANAGER", label: "Manager review" },
  { key: "ADMIN", label: "Admin review" },
  { key: "DELIVERED", label: "Delivered" },
];

// Maps a backend RequestStatus onto { stageIndex, rejectedAtStage }
function resolveProgress(status) {
  switch (status) {
    case "PENDING":
      return { current: 1, rejectedAt: null };
    case "MANAGER_REJECTED":
      return { current: 1, rejectedAt: 1 };
    case "MANAGER_APPROVED":
      return { current: 2, rejectedAt: null };
    case "REJECTED":
      return { current: 2, rejectedAt: 2 };
    case "APPROVED":
      return { current: 3, rejectedAt: null };
    case "DELIVERED":
      return { current: 3, rejectedAt: null };
    default:
      return { current: 0, rejectedAt: null };
  }
}

export default function ApprovalTrail({ status, updatedDate }) {
  const { current, rejectedAt } = resolveProgress(status);
  const isDelivered = status === "DELIVERED";

  return (
    <div className="flex items-start w-full">
      {STAGES.map((stage, i) => {
        const isRejectedHere = rejectedAt === i;
        const isDone = i < current || (i === current && isDelivered);
        const isActive = i === current && !isDelivered && !rejectedAt;
        const isLast = i === STAGES.length - 1;

        let circleClasses = "bg-white border-2 border-ink/15 text-slate-light";
        let Icon = Clock;

        if (isRejectedHere) {
          circleClasses = "bg-coral border-2 border-coral text-white";
          Icon = X;
        } else if (isDone) {
          circleClasses = "bg-good border-2 border-good text-white";
          Icon = Check;
        } else if (isActive) {
          circleClasses = "bg-signal border-2 border-signal text-white";
          Icon = Clock;
        }

        const lineDone = i < current && rejectedAt === null;

        return (
          <div key={stage.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${circleClasses}`}>
                <Icon size={15} />
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-ink">{stage.label}</div>
                {(isDone || isRejectedHere) && updatedDate && i === current && (
                  <div className="text-[10px] font-mono-num text-slate-light mt-0.5">
                    {new Date(updatedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-[2px] mx-1 mb-6 ${
                  lineDone ? "bg-good" : "bg-ink/10"
                }`}
                style={{
                  backgroundImage: lineDone
                    ? "none"
                    : "repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 8px)",
                  color: "#12172B1A",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
