import { useState, useEffect } from "react";

export default function NormField({ value, onCommit, placeholder, className }) {
    const [local, setLocal] = useState(value);

    useEffect(() => {
        setLocal(value);
    }, [value]);

    return (
        <input
            type="text"
            placeholder={placeholder}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => onCommit(local)}
            className={className}
        />
    );
}
