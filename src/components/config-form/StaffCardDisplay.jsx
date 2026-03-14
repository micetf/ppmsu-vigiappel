import { fullName } from "../../utils/formatName";

export default function StaffCardDisplay({
    staff,
    rattachementLabel,
    hasError,
    onEdit,
    onRemove,
}) {
    return (
        <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors
            ${
                hasError
                    ? "bg-red-50 border border-red-300"
                    : "bg-gray-50 border border-gray-200 hover:border-gray-300"
            }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="text-base shrink-0">👤</span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                        {fullName(staff.nom, staff.prenom) || (
                            <span className="text-red-500">Nom manquant</span>
                        )}
                    </p>
                    <p className="text-xs text-gray-500">
                        {[
                            staff.fonction || "Fonction non précisée",
                            rattachementLabel,
                        ].join("  ·  ")}
                    </p>
                </div>
            </div>
            <div className="flex gap-1 shrink-0">
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                    ✎
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
