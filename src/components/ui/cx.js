// src/components/ui/cx.js
export const cx = (error) =>
    `input ${error ? "border-red-500 focus:ring-red-400" : ""}`.trim();
