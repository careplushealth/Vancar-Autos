import './Dropdown.css';

export default function Dropdown({ label, value, onChange, options }) {
    return (
        <div className="dropdown">
            {label && <label className="dropdown__label">{label}</label>}
            <select
                className="dropdown__select"
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                        {typeof opt === 'string' ? opt : opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
