// src/components/ui/Field.jsx
export default function Field({ label, error, children, optional = false }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {optional && (
                    <span className="text-gray-400 font-normal">
                        {" "}
                        (optionnel)
                    </span>
                )}
            </label>
            {children}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
