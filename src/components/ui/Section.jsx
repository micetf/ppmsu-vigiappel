// src/components/ui/Section.jsx
export default function Section({ title, children }) {
    return (
        <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-2">
                {title}
            </h3>
            {children}
        </div>
    );
}
