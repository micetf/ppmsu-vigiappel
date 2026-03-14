import { useState, useEffect } from "react";

export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(storedValue));
        } catch {
            // localStorage indisponible (navigation privée, quota dépassé)
        }
    }, [key, storedValue]);

    const removeValue = () => {
        try {
            localStorage.removeItem(key);
        } catch {
            console.log("Erreur removeValue");
        }
        setStoredValue(initialValue);
    };

    return [storedValue, setStoredValue, removeValue];
}
